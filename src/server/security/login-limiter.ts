import "server-only";

import { createSupabaseAdminClient } from "@/server/db/admin";
import { hashRateLimitSubject } from "@/server/security/ratelimit";

export type LoginThrottle = { locked: boolean; challengeRequired: boolean; retryAfterSeconds: number };

function loginHashes(email: string, ip: string) {
  const normalizedEmail = email.trim().toLowerCase().slice(0, 254);
  const normalizedIp = ip.trim().slice(0, 128) || "unknown";
  const accountHash = hashRateLimitSubject("login-account", normalizedEmail);
  const ipHash = hashRateLimitSubject("login-ip", normalizedIp);
  const pairHash = hashRateLimitSubject("login-account-ip", `${accountHash}:${ipHash}`);
  return { accountHash, pairHash };
}

export async function inspectLoginThrottle(email: string, ip: string): Promise<LoginThrottle> {
  try {
    const { accountHash, pairHash } = loginHashes(email, ip);
    const { data, error } = await createSupabaseAdminClient().rpc("login_throttle_status", {
      p_account_hash: accountHash,
      p_pair_hash: pairHash,
    });
    if (error || !data || typeof data !== "object") throw new Error("login_limiter_unavailable");
    const result = data as Record<string, unknown>;
    const retry = Number(result.retry_after_seconds);
    if (typeof result.locked !== "boolean" || typeof result.challenge_required !== "boolean") {
      throw new Error("login_limiter_unavailable");
    }
    return {
      locked: result.locked,
      challengeRequired: result.challenge_required,
      retryAfterSeconds: Number.isFinite(retry) ? Math.max(1, Math.floor(retry)) : 60,
    };
  } catch {
    throw new Error("login_limiter_unavailable");
  }
}

export async function recordFailedLogin(email: string, ip: string): Promise<boolean> {
  return record("record_login_failure", email, ip);
}

export async function recordSuccessfulLogin(email: string, ip: string): Promise<boolean> {
  return record("clear_login_failures", email, ip);
}

async function record(functionName: "record_login_failure" | "clear_login_failures", email: string, ip: string): Promise<boolean> {
  try {
    const { accountHash, pairHash } = loginHashes(email, ip);
    const { data, error } = await createSupabaseAdminClient().rpc(functionName, {
      p_account_hash: accountHash,
      p_pair_hash: pairHash,
    });
    return !error && data === true;
  } catch {
    return false;
  }
}
