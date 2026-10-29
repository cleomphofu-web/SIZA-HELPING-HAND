import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const enabled = process.env.RUN_LOCAL_SUPABASE_RLS_TESTS === "true";
const integration = enabled ? describe : describe.skip;
let service: SupabaseClient;
let anon: SupabaseClient;
const subjectHashes = new Set<string>();

function localConfig() {
  const url = process.env.LOCAL_SUPABASE_URL;
  const anonKey = process.env.LOCAL_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) throw new Error("Explicit local Supabase credentials are required.");
  const parsed = new URL(url);
  if (!(parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "::1")) {
    throw new Error("Refusing rate-limit integration setup unless the Supabase URL is loopback.");
  }
  return { url, anonKey, serviceRoleKey };
}

function digest() { return crypto.randomUUID().replaceAll("-", "").padEnd(64, "0"); }

integration("Postgres rate limits against local Supabase", () => {
  beforeAll(() => {
    const config = localConfig();
    service = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    anon = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  });

  afterAll(async () => {
    if (!service || subjectHashes.size === 0) return;
    await service.from("rate_limit_counters").delete().in("subject_hash", [...subjectHashes]);
  });

  it("denies anon access to stored counters and privileged limiter RPCs", async () => {
    const { error: readError } = await anon.from("rate_limit_counters").select("bucket").limit(1);
    expect(readError).not.toBeNull();
    const { error: rpcError } = await anon.rpc("consume_rate_limit", { p_bucket: "booking", p_subject_hash: digest() });
    expect(rpcError).not.toBeNull();
  }, 15_000);

  it("runs bounded expired-counter cleanup through the service-only job function", async () => {
    const { data, error } = await service.rpc("prune_expired_rate_limit_counters", { p_limit: 20 });
    expect(error).toBeNull();
    expect(Number.isInteger(data) && Number(data) >= 0 && Number(data) <= 20).toBe(true);
  }, 15_000);

  it("atomically allows the configured count and blocks the next request", async () => {
    const subject = digest();
    subjectHashes.add(subject);
    const results = [];
    for (let attempt = 0; attempt < 11; attempt += 1) {
      const { data, error } = await service.rpc("consume_rate_limit", { p_bucket: "booking", p_subject_hash: subject });
      expect(error).toBeNull();
      results.push(data as { allowed: boolean; retry_after_seconds: number });
    }
    expect(results.slice(0, 10).every((result) => result.allowed)).toBe(true);
    expect(results[10]).toMatchObject({ allowed: false });
    expect(results[10].retry_after_seconds).toBeGreaterThan(0);
  }, 15_000);

  it("limits admin MFA verification to five attempts in its configured window", async () => {
    const { data: config, error: configError } = await service.from("app_config").select("value").eq("key", "rate_limit_mfa_verify").single();
    expect(configError).toBeNull();
    expect(config?.value).toEqual({ limit: 5, window_seconds: 900 });
    const subject = digest();
    subjectHashes.add(subject);
    const results = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const { data, error } = await service.rpc("consume_rate_limit", { p_bucket: "mfa_verify", p_subject_hash: subject });
      expect(error).toBeNull();
      results.push(data as { allowed: boolean; retry_after_seconds: number });
    }
    expect(results.slice(0, 5).every((result) => result.allowed)).toBe(true);
    expect(results[5]).toMatchObject({ allowed: false });
    expect(results[5].retry_after_seconds).toBeGreaterThan(0);
  }, 15_000);

  it("locks only a repeated account/IP pair and challenges the account across pairs", async () => {
    const accountHash = digest();
    const pairHash = digest();
    subjectHashes.add(accountHash);
    subjectHashes.add(pairHash);

    for (let failure = 0; failure < 5; failure += 1) {
      const { error } = await service.rpc("record_login_failure", { p_account_hash: accountHash, p_pair_hash: pairHash });
      expect(error).toBeNull();
    }
    const { data: pairState, error: pairError } = await service.rpc("login_throttle_status", { p_account_hash: accountHash, p_pair_hash: pairHash });
    expect(pairError).toBeNull();
    expect(pairState).toMatchObject({ locked: true, challenge_required: false });

    for (let failure = 5; failure < 20; failure += 1) {
      const otherPair = digest();
      subjectHashes.add(otherPair);
      const { error } = await service.rpc("record_login_failure", { p_account_hash: accountHash, p_pair_hash: otherPair });
      expect(error).toBeNull();
    }
    const nextPair = digest();
    subjectHashes.add(nextPair);
    const { data: accountState, error: accountError } = await service.rpc("login_throttle_status", { p_account_hash: accountHash, p_pair_hash: nextPair });
    expect(accountError).toBeNull();
    expect(accountState).toMatchObject({ locked: false, challenge_required: true });

    const { data: cleared, error: clearError } = await service.rpc("clear_login_failures", { p_account_hash: accountHash, p_pair_hash: nextPair });
    expect(clearError).toBeNull();
    expect(cleared).toBe(true);
  }, 15_000);
});
