import "server-only";

import { createHmac } from "node:crypto";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { env } from "@/server/config/env";

export type RateLimitBucket = "booking" | "apply" | "upload" | "login" | "accept" | "report" | "code_attempt" | "admin_action" | "mfa_verify";
type LimitResult = { allowed: boolean; retryAfterSeconds: number };

const buckets = new Set<RateLimitBucket>(["booking", "apply", "upload", "login", "accept", "report", "code_attempt", "admin_action", "mfa_verify"]);

export function hashRateLimitSubject(bucket: string, subject: string): string {
  return createHmac("sha256", env.SUPABASE_SERVICE_ROLE_KEY)
    .update(`siza-rate-limit-v1\0${bucket}\0${subject}`)
    .digest("hex");
}

function failClosed(): LimitResult {
  return { allowed: false, retryAfterSeconds: 60 };
}

/** Uses the database's configured bucket/window. Only a keyed digest reaches Postgres. */
export async function limit(bucket: RateLimitBucket, subject: string): Promise<LimitResult> {
  if (!buckets.has(bucket) || !subject) return failClosed();
  try {
    const client = createSupabaseAdminClient();
    const { data, error } = await client.rpc("consume_rate_limit", {
      p_bucket: bucket,
      p_subject_hash: hashRateLimitSubject(bucket, subject),
    });
    if (error || !data || typeof data !== "object") return failClosed();
    const result = data as { allowed?: unknown; retry_after_seconds?: unknown };
    const retry = Number(result.retry_after_seconds);
    if (typeof result.allowed !== "boolean") return failClosed();
    return {
      allowed: result.allowed,
      retryAfterSeconds: Number.isFinite(retry) ? Math.max(1, Math.floor(retry)) : 60,
    };
  } catch {
    return failClosed();
  }
}
