import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const enabled = process.env.RUN_LOCAL_SUPABASE_RLS_TESTS === "true";
const integration = enabled ? describe : describe.skip;
let service: SupabaseClient;
let adminClient: SupabaseClient;
let anonClient: SupabaseClient;
let adminId = "";

function localConfig() {
  const url = process.env.LOCAL_SUPABASE_URL;
  const anonKey = process.env.LOCAL_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) throw new Error("Set explicit local Supabase test credentials.");
  if (!(new URL(url).hostname === "localhost" || new URL(url).hostname === "127.0.0.1" || new URL(url).hostname === "::1")) {
    throw new Error("Refusing admin MFA test outside loopback Supabase.");
  }
  return { url, anonKey, serviceRoleKey };
}

function base32ToBytes(secret: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const character of secret.replace(/=+$/g, "")) {
    const value = alphabet.indexOf(character);
    if (value < 0) throw new Error("Invalid TOTP secret in local Auth response.");
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  return Buffer.from(bytes);
}

function currentTotp(secret: string) {
  const counter = Math.floor(Date.now() / 1000 / 30);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", base32ToBytes(secret)).update(message).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const binary = ((digest[offset]! & 0x7f) << 24) | (digest[offset + 1]! << 16) | (digest[offset + 2]! << 8) | digest[offset + 3]!;
  return String(binary % 1_000_000).padStart(6, "0");
}

integration("admin TOTP against local Supabase Auth", () => {
  beforeAll(async () => {
    const config = localConfig();
    service = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const email = `siza-admin-mfa-${randomBytes(12).toString("hex")}@example.test`;
    const password = `${randomBytes(24).toString("base64url")}A!7`;
    const { data: created, error: createError } = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (createError || !created.user) throw new Error("Could not create disposable local admin MFA identity.");
    adminId = created.user.id;
    const { error: profileError } = await service.from("profiles").insert({
      id: adminId,
      role: "admin",
      first_name: "Local MFA",
      phone: `+2782${Array.from(randomBytes(7), (value) => String(value % 10)).join("")}`,
      terms_version: "local-test",
      terms_accepted_at: new Date().toISOString(),
      privacy_version: "local-test",
      privacy_accepted_at: new Date().toISOString(),
    });
    if (profileError) throw new Error("Could not seed disposable local admin MFA profile.");
    const { error: membershipError } = await service.from("admins").insert({ user_id: adminId });
    if (membershipError) throw new Error("Could not seed disposable local admin MFA membership.");
    adminClient = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    anonClient = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error: signInError } = await adminClient.auth.signInWithPassword({ email, password });
    if (signInError) throw new Error("Could not sign in disposable local admin MFA identity.");
  }, 30_000);

  afterAll(async () => {
    if (adminClient) await adminClient.auth.signOut();
    if (service && adminId) {
      const { error } = await service.auth.admin.deleteUser(adminId);
      if (error) throw new Error("Could not clean up disposable local admin MFA identity.");
    }
  }, 30_000);

  it("enrolls and verifies a TOTP factor, then upgrades the admin session to aal2", async () => {
    const { data: enrollment, error: enrollmentError } = await adminClient.auth.mfa.enroll({ factorType: "totp", friendlyName: "SIZA local test" });
    expect(enrollmentError).toBeNull();
    expect(enrollment?.totp?.secret).toBeTruthy();
    const factorId = enrollment!.id;
    const code = currentTotp(enrollment!.totp!.secret);
    const codeHash = createHmac("sha256", localConfig().serviceRoleKey)
      .update(`siza-admin-mfa-replay-v1\0${factorId}\0${code}`)
      .digest("hex");
    const { data: firstReservation, error: firstReservationError } = await service.rpc("reserve_admin_mfa_code", { p_factor_id: factorId, p_code_hash: codeHash });
    expect(firstReservationError).toBeNull();
    expect(firstReservation).toBe(true);
    const { data: replayReservation, error: replayReservationError } = await service.rpc("reserve_admin_mfa_code", { p_factor_id: factorId, p_code_hash: codeHash });
    expect(replayReservationError).toBeNull();
    expect(replayReservation).toBe(false);
    const concurrentHash = createHmac("sha256", localConfig().serviceRoleKey)
      .update(`siza-admin-mfa-replay-v1\0${factorId}\0${"654321"}`)
      .digest("hex");
    const concurrent = await Promise.all(Array.from({ length: 12 }, () => service.rpc("reserve_admin_mfa_code", { p_factor_id: factorId, p_code_hash: concurrentHash })));
    expect(concurrent.every((result) => result.error === null)).toBe(true);
    expect(concurrent.filter((result) => result.data === true)).toHaveLength(1);
    const { data: replayWindow, error: replayWindowError } = await service.from("app_config").select("value").eq("key", "admin_mfa_replay_seconds").single();
    expect(replayWindowError).toBeNull();
    expect(replayWindow?.value).toBe(90);
    const { data: challenge, error: challengeError } = await adminClient.auth.mfa.challenge({ factorId });
    expect(challengeError).toBeNull();
    const { error: verifyError } = await adminClient.auth.mfa.verify({ factorId, challengeId: challenge!.id, code });
    expect(verifyError).toBeNull();
    const { data: replayChallenge, error: replayChallengeError } = await adminClient.auth.mfa.challenge({ factorId });
    expect(replayChallengeError).toBeNull();
    const { error: replayError } = await adminClient.auth.mfa.verify({ factorId, challengeId: replayChallenge!.id, code: currentTotp(enrollment!.totp!.secret) });
    // Supabase accepts replayed TOTP within its time step, so our pre-verification Postgres reservation is the replay guard.
    expect(replayError).toBeNull();
    const { data: assurance, error: assuranceError } = await adminClient.auth.mfa.getAuthenticatorAssuranceLevel();
    expect(assuranceError).toBeNull();
    expect(assurance?.currentLevel).toBe("aal2");
  }, 30_000);

  it("denies direct replay-table access to anon, authenticated and service-role clients", async () => {
    const factorId = randomUUID();
    const codeHash = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    for (const client of [anonClient, adminClient, service]) {
      const { error: readError } = await client.from("admin_mfa_code_uses").select("factor_id").limit(1);
      expect(readError).not.toBeNull();
      const { error: insertError } = await client.from("admin_mfa_code_uses").insert({ factor_id: factorId, code_hash: codeHash, expires_at: expiresAt });
      expect(insertError).not.toBeNull();
    }
    const { error: anonRpcError } = await anonClient.rpc("reserve_admin_mfa_code", { p_factor_id: factorId, p_code_hash: codeHash });
    expect(anonRpcError).not.toBeNull();
    const { error: adminRpcError } = await adminClient.rpc("reserve_admin_mfa_code", { p_factor_id: factorId, p_code_hash: codeHash });
    expect(adminRpcError).not.toBeNull();
  }, 15_000);
});
