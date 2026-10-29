import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const enabled = process.env.RUN_LOCAL_SUPABASE_RLS_TESTS === "true";
const integration = enabled ? describe : describe.skip;
type Identity = { id: string; email: string; password: string; client: SupabaseClient };
let service: SupabaseClient;
const identities: Identity[] = [];
const bookingIds: string[] = [];
let host: Identity;
let helper: Identity;
let otherHelper: Identity;
type CheckInAttemptRow = { accepted: boolean; attempts: number; locked_until: string | null };

function localConfig() {
  const url = process.env.LOCAL_SUPABASE_URL;
  const anonKey = process.env.LOCAL_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) throw new Error("Set explicit local Supabase test connection values.");
  if (!(new URL(url).hostname === "localhost" || new URL(url).hostname === "127.0.0.1" || new URL(url).hostname === "::1")) {
    throw new Error("Refusing check-in integration setup: local Supabase URL must resolve to loopback.");
  }
  return { url, anonKey, serviceRoleKey };
}

async function createIdentity(role: "host" | "helper", url: string, anonKey: string): Promise<Identity> {
  const email = `siza-check-in-${role}-${crypto.randomUUID()}@example.test`;
  const password = `${crypto.randomUUID()}-Synthetic!`;
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error("Could not create a disposable local check-in identity.");
  const phone = `+2782${Array.from(crypto.getRandomValues(new Uint8Array(7)), (value) => value % 10).join("")}`;
  const { error: profileError } = await service.from("profiles").insert({
    id: data.user.id,
    role,
    first_name: role === "host" ? "Test Host" : "Test Helper",
    phone,
    terms_version: "local-test",
    terms_accepted_at: new Date().toISOString(),
    privacy_version: "local-test",
    privacy_accepted_at: new Date().toISOString(),
  });
  if (profileError) throw new Error("Could not seed a disposable local check-in profile.");
  if (role === "helper") {
    const { error: helperError } = await service.from("helper_details").insert({
      user_id: data.user.id,
      date_of_birth: "1990-01-01",
      job_title: "Home helper",
      services: ["home_cleaning"],
      suburbs: ["Rosebank"],
      status: "approved",
    });
    if (helperError) throw new Error("Could not seed a disposable local helper detail row.");
  }
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error("Could not authenticate a disposable local check-in identity.");
  const identity = { id: data.user.id, email, password, client };
  identities.push(identity);
  return identity;
}

async function createAssignedBooking(expiresAt: string) {
  const startAt = new Date(Date.now() - 60 * 60_000);
  const { data, error } = await service.from("phase_a_bookings").insert({
    host_id: host.id,
    address_line: "1 Synthetic Test Road",
    suburb: "Rosebank",
    city: "Johannesburg",
    services: ["home_cleaning"],
    helpers_needed: 1,
    start_at: startAt.toISOString(),
    end_at_est: new Date(startAt.getTime() + 2 * 60 * 60_000).toISOString(),
    status: "assigned",
    pay_per_helper_cents: 10000,
    transport_per_helper_cents: 1000,
    idempotency_key: crypto.randomUUID(),
    check_in_code_hash: "synthetic-hmac-only",
    check_in_code_expires_at: expiresAt,
  }).select("id").single();
  if (error || !data) throw new Error("Could not seed the local check-in booking.");
  bookingIds.push(data.id);
  const { error: assignmentError } = await service.from("booking_assignments").insert({ booking_id: data.id, helper_id: helper.id, slot: 1, status: "accepted" });
  if (assignmentError) throw new Error("Could not seed the local check-in assignment.");
  return data.id;
}

async function callCheckIn(args: { p_booking_id: string; p_helper_id: string; p_matches: boolean; p_now: string }) {
  const { data, error } = await service.rpc("check_in_phase_a_booking", args).single();
  return { data: data as unknown as CheckInAttemptRow | null, error };
}

integration("atomic helper check-in against an explicitly selected local Supabase stack", () => {
  beforeAll(async () => {
    const config = localConfig();
    service = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    host = await createIdentity("host", config.url, config.anonKey);
    helper = await createIdentity("helper", config.url, config.anonKey);
    otherHelper = await createIdentity("helper", config.url, config.anonKey);
  }, 30_000);

  afterAll(async () => {
    if (bookingIds.length) await service.from("phase_a_bookings").delete().in("id", bookingIds);
    for (const identity of identities) {
      await identity.client.auth.signOut();
      await service.auth.admin.deleteUser(identity.id);
    }
  }, 30_000);

  it("records five concurrent wrong codes, locks for the configured window, then resets the attempt count", async () => {
    const now = new Date();
    const bookingId = await createAssignedBooking(new Date(now.getTime() + 12 * 60 * 60_000).toISOString());
    const payload = { p_booking_id: bookingId, p_helper_id: helper.id, p_matches: false, p_now: now.toISOString() };
    const attempts = await Promise.all(Array.from({ length: 5 }, () => callCheckIn(payload)));
    expect(attempts.every((attempt) => attempt.error === null)).toBe(true);
    expect(attempts.map((attempt) => Number(attempt.data?.attempts)).sort()).toEqual([1, 2, 3, 4, 5]);
    const lockResult = attempts.find((attempt) => attempt.data?.locked_until !== null);
    const lockedUntil = Date.parse(lockResult?.data?.locked_until ?? "");
    expect(lockedUntil).toBeGreaterThanOrEqual(now.getTime() + 14 * 60_000);
    expect(lockedUntil).toBeLessThanOrEqual(now.getTime() + 16 * 60_000);
    const duringLock = await callCheckIn({ ...payload, p_now: new Date(now.getTime() + 2 * 60_000).toISOString() });
    expect(duringLock.data).toMatchObject({ accepted: false, attempts: 5 });
    const audit = await service.from("phase_a_audit_log").select("id").eq("entity", "phase_a_bookings").eq("entity_id", bookingId).eq("action", "check_in_code_locked");
    expect(audit.data).toHaveLength(1);

    const afterLock = await callCheckIn({ ...payload, p_now: new Date(now.getTime() + 16 * 60_000).toISOString() });
    expect(afterLock.data).toMatchObject({ accepted: false, attempts: 1, locked_until: null });
  });

  it("atomically checks in only the assigned helper and safely replays a completed check-in", async () => {
    const now = new Date();
    const bookingId = await createAssignedBooking(new Date(now.getTime() + 12 * 60 * 60_000).toISOString());
    const wrongOwner = await callCheckIn({ p_booking_id: bookingId, p_helper_id: otherHelper.id, p_matches: true, p_now: now.toISOString() });
    expect(wrongOwner.error).toBeNull();
    expect(wrongOwner.data?.accepted).toBe(false);
    const wrongRole = await callCheckIn({ p_booking_id: bookingId, p_helper_id: host.id, p_matches: true, p_now: now.toISOString() });
    expect(wrongRole.error).toBeNull();
    expect(wrongRole.data?.accepted).toBe(false);

    const denied = await helper.client.rpc("check_in_phase_a_booking", { p_booking_id: bookingId, p_helper_id: helper.id, p_matches: true, p_now: now.toISOString() });
    expect(denied.error).toBeTruthy();
    const legacyRpc = await helper.client.rpc("record_phase_a_code_attempt", { p_booking_id: bookingId, p_now: now.toISOString(), p_matches: true, p_lock_minutes: 15 });
    expect(legacyRpc.error).toBeTruthy();

    const accepted = await callCheckIn({ p_booking_id: bookingId, p_helper_id: helper.id, p_matches: true, p_now: now.toISOString() });
    expect(accepted.error).toBeNull();
    expect(accepted.data?.accepted).toBe(true);
    const [{ data: booking }, { data: assignment }] = await Promise.all([
      service.from("phase_a_bookings").select("status").eq("id", bookingId).single(),
      service.from("booking_assignments").select("checked_in_at").eq("booking_id", bookingId).eq("helper_id", helper.id).single(),
    ]);
    expect(booking?.status).toBe("in_progress");
    expect(Date.parse(assignment?.checked_in_at ?? "")).toBe(now.getTime());
    const wrongReplay = await callCheckIn({ p_booking_id: bookingId, p_helper_id: helper.id, p_matches: false, p_now: new Date(now.getTime() + 60_000).toISOString() });
    expect(wrongReplay.data).toMatchObject({ accepted: false, attempts: 0 });
    const correctReplay = await callCheckIn({ p_booking_id: bookingId, p_helper_id: helper.id, p_matches: true, p_now: new Date(now.getTime() + 60_000).toISOString() });
    expect(correctReplay.data).toMatchObject({ accepted: true, attempts: 0 });
  });

  it("rejects a correct code after expiry without changing either booking or assignment", async () => {
    const now = new Date();
    const bookingId = await createAssignedBooking(new Date(now.getTime() - 1).toISOString());
    const expired = await callCheckIn({ p_booking_id: bookingId, p_helper_id: helper.id, p_matches: true, p_now: now.toISOString() });
    expect(expired.error).toBeNull();
    expect(expired.data?.accepted).toBe(false);
    const [{ data: booking }, { data: assignment }] = await Promise.all([
      service.from("phase_a_bookings").select("status, code_attempts").eq("id", bookingId).single(),
      service.from("booking_assignments").select("checked_in_at").eq("booking_id", bookingId).eq("helper_id", helper.id).single(),
    ]);
    expect(booking).toMatchObject({ status: "assigned", code_attempts: 0 });
    expect(assignment?.checked_in_at).toBeNull();
  });
});
