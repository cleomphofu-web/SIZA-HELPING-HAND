import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const enabled = process.env.RUN_LOCAL_SUPABASE_RLS_TESTS === "true";
const integration = enabled ? describe : describe.skip;

type Identity = { id: string; email: string; password: string; role: "host" | "wrong-host" | "helper" | "helper2" | "helper3" | "helper4" | "helper5" | "helper6" | "helper7" | "helper8" | "helper9" | "helper10" | "pending-helper" | "admin" | "admin-profile-only" };
let service: SupabaseClient;
const identities: Identity[] = [];
let bookingId = "";
let assignmentBookingId = "";
let invalidHostBookingId = "";
let adminReopenBookingId = "";
let helperReopenBookingId = "";
let concurrentReopenBookingId = "";
let cancellationRaceBookingId = "";
let noShowTransitionBookingId = "";
let noShowResolutionBookingId = "";
let noShowSoloResolutionBookingId = "";
let noShowPendingCheckInBookingId = "";
let offerExpiryBookingId = "";
let atomicBookingId = "";
let fourSlotBookingId = "";
let serviceMismatchBookingId = "";
let genderPreferenceBookingId = "";
let softDeletedOfferBookingId = "";
let mixPreferenceBookingId = "";
let completionBookingId = "";
let hostOnlyCompletionBookingId = "";
let matchingSuburb = "";
let noShowSuburb = "";
const overlapBookingIds: string[] = [];
const autoReleaseBookingIds: string[] = [];
const roleClients = new Map<Identity["role"], SupabaseClient>();

async function createNoShowFixture(hostId: string, helperId: string, address: string) {
  const addressNumber = Number(address.match(/\d+/)?.[0] ?? "0");
  const startAt = new Date(Date.now() + (24 + addressNumber * 4) * 60 * 60_000);
  const { data: booking, error: bookingError } = await service.from("phase_a_bookings").insert({
    host_id: hostId,
    address_line: address,
    suburb: "Rosebank",
    city: "Johannesburg",
    services: ["home"],
    helpers_needed: 1,
    start_at: startAt.toISOString(),
    end_at_est: new Date(startAt.getTime() + 60 * 60_000).toISOString(),
    pay_per_helper_cents: 10000,
    transport_per_helper_cents: 1000,
    idempotency_key: crypto.randomUUID(),
  }).select("id").single();
  if (bookingError || !booking) throw new Error("Could not seed local no-show booking fixture.");
  const { error: assignmentError } = await service.from("booking_assignments").insert({
    booking_id: booking.id,
    helper_id: helperId,
    slot: 1,
    status: "no_show",
    no_show_at: new Date().toISOString(),
  });
  if (assignmentError) throw new Error(`Could not seed local no-show assignment fixture (${assignmentError.code}).`);
  return booking.id;
}

async function createAutoReleaseFixture(hostId: string, helperIds: string[], endAt: Date, uncheckedHelpers: string[] = [], hostConfirmed = false) {
  const startAt = new Date(endAt.getTime() - 60 * 60_000);
  const { data: booking, error: bookingError } = await service.from("phase_a_bookings").insert({
    host_id: hostId,
    address_line: "20 Local Test Lane",
    suburb: "Rosebank",
    city: "Johannesburg",
    services: ["home"],
    helpers_needed: helperIds.length,
    start_at: startAt.toISOString(),
    end_at_est: endAt.toISOString(),
    pay_per_helper_cents: 10000,
    transport_per_helper_cents: 1000,
    status: "in_progress",
    idempotency_key: crypto.randomUUID(),
  }).select("id").single();
  if (bookingError || !booking) throw new Error("Could not seed local auto-release booking fixture.");
  autoReleaseBookingIds.push(booking.id);
  const { error: assignmentError } = await service.from("booking_assignments").insert(helperIds.map((helperId, index) => ({
    booking_id: booking.id,
    helper_id: helperId,
    slot: index + 1,
    status: "accepted",
    checked_in_at: uncheckedHelpers.includes(helperId) ? null : new Date(endAt.getTime() - 30 * 60_000).toISOString(),
    host_confirmed_at: hostConfirmed ? new Date(endAt.getTime() - 20 * 60_000).toISOString() : null,
  })));
  if (assignmentError) throw new Error("Could not seed local auto-release assignment fixture.");
  return booking.id;
}

function localConfig() {
  const url = process.env.LOCAL_SUPABASE_URL;
  const anonKey = process.env.LOCAL_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) throw new Error("Set explicit LOCAL_SUPABASE_URL, LOCAL_SUPABASE_ANON_KEY, and LOCAL_SUPABASE_SERVICE_ROLE_KEY values.");
  const parsed = new URL(url);
  if (!(["localhost", "127.0.0.1", "::1"].includes(parsed.hostname))) {
    throw new Error("Refusing RLS integration setup: LOCAL_SUPABASE_URL must point to localhost or 127.0.0.1.");
  }
  return { url, anonKey, serviceRoleKey };
}

async function createIdentity(role: "host" | "helper" | "admin", anonKey: string, url: string, key: Identity["role"] = role, addAdminMembership = true): Promise<Identity> {
  const identity: Identity = {
    id: "",
    role: key,
    email: `siza-rls-${key}-${crypto.randomUUID()}@example.test`,
    password: `${crypto.randomUUID()}-Test-only!`,
  };
  const { data, error } = await service.auth.admin.createUser({ email: identity.email, password: identity.password, email_confirm: true });
  if (error || !data.user) throw new Error(`Could not create disposable ${role} identity (${error?.code ?? "missing_user"}: ${error?.message ?? "no user returned"}).`);
  identity.id = data.user.id;
  identities.push(identity);

  const phoneSuffix = Array.from(crypto.getRandomValues(new Uint8Array(7)), (digit) => String(digit % 10)).join("");
  const phone = `+2782${phoneSuffix}`;
  const { error: profileError } = await service.from("profiles").insert({
    id: identity.id,
    role,
    first_name: role === "host" ? "Host" : role === "helper" ? "Helper" : "Admin",
    phone,
    terms_version: "local-test",
    terms_accepted_at: new Date().toISOString(),
    privacy_version: "local-test",
    privacy_accepted_at: new Date().toISOString(),
  });
  if (profileError) throw new Error(`Could not seed disposable ${role} profile (${profileError.code}: ${profileError.message}).`);
  if (role === "admin" && addAdminMembership) {
    const { error: adminError } = await service.from("admins").insert({ user_id: identity.id });
    if (adminError) throw new Error("Could not seed disposable admin membership.");
  }

  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email: identity.email, password: identity.password });
  if (signInError) throw new Error(`Could not authenticate disposable ${role} identity.`);
  roleClients.set(key, client);
  return identity;
}

integration("booking RLS against an explicitly selected local Supabase stack", () => {
  beforeAll(async () => {
    matchingSuburb = `SizaMatch${crypto.randomUUID().replaceAll("-", "")}`;
    noShowSuburb = `SizaNoShow${crypto.randomUUID().replaceAll("-", "")}`;
    const config = localConfig();
    service = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    await createIdentity("host", config.anonKey, config.url);
    await createIdentity("host", config.anonKey, config.url, "wrong-host");
    await createIdentity("helper", config.anonKey, config.url);
    await createIdentity("helper", config.anonKey, config.url, "helper2");
    await createIdentity("helper", config.anonKey, config.url, "helper3");
    await createIdentity("helper", config.anonKey, config.url, "helper4");
    await createIdentity("helper", config.anonKey, config.url, "helper5");
    await createIdentity("helper", config.anonKey, config.url, "helper6");
    await createIdentity("helper", config.anonKey, config.url, "helper7");
    await createIdentity("helper", config.anonKey, config.url, "helper8");
    await createIdentity("helper", config.anonKey, config.url, "helper9");
    await createIdentity("helper", config.anonKey, config.url, "pending-helper");
    await createIdentity("admin", config.anonKey, config.url);
    await createIdentity("admin", config.anonKey, config.url, "admin-profile-only", false);
    for (const key of ["helper", "helper2", "helper3", "helper4", "helper5", "helper6", "helper7", "helper8", "helper9", "pending-helper"] as const) {
      const helper = identities.find((identity) => identity.role === key);
      if (!helper) throw new Error("Local helper identity was not created.");
      const { error: helperError } = await service.from("helper_details").insert({
        user_id: helper.id,
        date_of_birth: "1990-01-01",
        job_title: "Home helper",
        services: ["home"],
        suburbs: ["Rosebank"],
        status: key === "pending-helper" ? "pending" : "approved",
      });
      if (helperError) throw new Error("Could not seed local-only helper eligibility fixture.");
    }
    const assignmentHelpers = identities.filter((identity) => identity.role === "helper" || identity.role === "helper2").map((identity) => identity.id);
    const { error: assignmentServicesError } = await service.from("helper_details").update({ services: ["home", "garden"] }).in("user_id", assignmentHelpers);
    if (assignmentServicesError) throw new Error("Could not seed fully service-qualified local assignment helpers.");
    const matchingOnlyIds = identities.filter((identity) => ["helper6", "helper7", "helper8", "helper9"].includes(identity.role)).map((identity) => identity.id);
    const { error: matchingSuburbError } = await service.from("helper_details").update({ suburbs: [matchingSuburb] }).in("user_id", matchingOnlyIds);
    if (matchingSuburbError) throw new Error("Could not isolate local matching preference fixtures.");
    const host = identities.find((identity) => identity.role === "host");
    if (!host) throw new Error("Local host identity was not created.");
    const { error: hostDetailsError } = await service.from("host_details").insert({
      user_id: host.id,
      address_line: "10 Local Test Lane",
      suburb: "Rosebank",
      city: "Johannesburg",
      notes_default: "Synthetic local-only profile fixture",
    });
    if (hostDetailsError) throw new Error("Could not seed local-only host profile fixture.");
    const { data, error } = await service.from("phase_a_bookings").insert({
      host_id: host.id,
      address_line: "1 Local Test Street",
      suburb: "Rosebank",
      city: "Johannesburg",
      services: ["home"],
      helpers_needed: 1,
      start_at: new Date(Date.now() + 86_400_000).toISOString(),
      end_at_est: new Date(Date.now() + 90_000_000).toISOString(),
      pay_per_helper_cents: 10000,
      transport_per_helper_cents: 1000,
      idempotency_key: crypto.randomUUID(),
    }).select("id").single();
    if (error || !data) throw new Error("Could not seed local-only booking RLS fixture.");
    bookingId = data.id;

    const { data: assignmentBooking, error: assignmentBookingError } = await service.from("phase_a_bookings").insert({
      host_id: host.id,
      address_line: "2 Local Test Street",
      suburb: "Rosebank",
      city: "Johannesburg",
      services: ["home", "garden"],
      helpers_needed: 2,
      start_at: new Date(Date.now() + 6 * 86_400_000).toISOString(),
      end_at_est: new Date(Date.now() + 6 * 86_400_000 + 60 * 60_000).toISOString(),
      pay_per_helper_cents: 10000,
      transport_per_helper_cents: 1000,
      idempotency_key: crypto.randomUUID(),
    }).select("id").single();
    if (assignmentBookingError || !assignmentBooking) throw new Error("Could not seed local-only assignment fixture.");
    assignmentBookingId = assignmentBooking.id;

    const { data: offerExpiryBooking, error: offerExpiryBookingError } = await service.from("phase_a_bookings").insert({
      host_id: host.id,
      address_line: "8 Local Test Street",
      suburb: "Rosebank",
      city: "Johannesburg",
      services: ["home"],
      helpers_needed: 2,
      start_at: new Date(Date.now() + 3 * 86_400_000).toISOString(),
      end_at_est: new Date(Date.now() + 3 * 86_400_000 + 60 * 60_000).toISOString(),
      pay_per_helper_cents: 10000,
      transport_per_helper_cents: 1000,
      idempotency_key: crypto.randomUUID(),
    }).select("id").single();
    if (offerExpiryBookingError || !offerExpiryBooking) throw new Error("Could not seed local-only offer expiry fixture.");
    offerExpiryBookingId = offerExpiryBooking.id;

    const helperAsHost = identities.find((identity) => identity.role === "helper");
    if (!helperAsHost) throw new Error("Local helper identity was not created.");
    const { data: invalidHostBooking, error: invalidHostBookingError } = await service.from("phase_a_bookings").insert({
      host_id: helperAsHost.id,
      address_line: "3 Local Test Street",
      suburb: "Rosebank",
      city: "Johannesburg",
      services: ["home"],
      helpers_needed: 1,
      start_at: new Date(Date.now() + 86_400_000).toISOString(),
      end_at_est: new Date(Date.now() + 90_000_000).toISOString(),
      pay_per_helper_cents: 10000,
      transport_per_helper_cents: 1000,
      idempotency_key: crypto.randomUUID(),
    }).select("id").single();
    if (invalidHostBookingError || !invalidHostBooking) throw new Error("Could not seed invalid-host role fixture.");
    invalidHostBookingId = invalidHostBooking.id;

    const initialHelper = identities.find((identity) => identity.role === "helper");
    if (!initialHelper) throw new Error("Local helper identity was not created.");
    adminReopenBookingId = await createNoShowFixture(host.id, initialHelper.id, "4 Local Test Street");
    helperReopenBookingId = await createNoShowFixture(host.id, initialHelper.id, "5 Local Test Street");
    concurrentReopenBookingId = await createNoShowFixture(host.id, initialHelper.id, "6 Local Test Street");
    cancellationRaceBookingId = await createNoShowFixture(host.id, initialHelper.id, "7 Local Test Street");

    const checkedInHelper = identities.find((identity) => identity.role === "helper2");
    const replacementCandidate = identities.find((identity) => identity.role === "helper3");
    if (!checkedInHelper || !replacementCandidate) throw new Error("Could not locate disposable no-show helpers.");
    const { data: noShowConfig } = await service.from("app_config").select("value").eq("key", "no_show_minutes").single();
    const noShowMinutes = Number(noShowConfig?.value);
    if (!Number.isInteger(noShowMinutes) || noShowMinutes < 1) throw new Error("Local no-show timing is not configured.");
    const noShowStart = new Date(Date.now() - (noShowMinutes + 5) * 60_000);
    const { data: noShowBooking, error: noShowBookingError } = await service.from("phase_a_bookings").insert({
      host_id: host.id,
      address_line: "8 Local Test Street",
      suburb: noShowSuburb,
      city: "Johannesburg",
      services: ["home"],
      helpers_needed: 2,
      start_at: noShowStart.toISOString(),
      end_at_est: new Date(noShowStart.getTime() + 2 * 60 * 60_000).toISOString(),
      pay_per_helper_cents: 10000,
      transport_per_helper_cents: 1000,
      status: "in_progress",
      idempotency_key: crypto.randomUUID(),
    }).select("id").single();
    if (noShowBookingError || !noShowBooking) throw new Error("Could not seed local atomic no-show booking.");
    noShowTransitionBookingId = noShowBooking.id;
    const { error: noShowAssignmentsError } = await service.from("booking_assignments").insert([
      { booking_id: noShowBooking.id, helper_id: initialHelper.id, slot: 1, status: "accepted" },
      { booking_id: noShowBooking.id, helper_id: checkedInHelper.id, slot: 2, status: "accepted", checked_in_at: new Date().toISOString() },
    ]);
    if (noShowAssignmentsError) throw new Error("Could not seed local atomic no-show assignments.");
  }, 30_000);

  afterEach(async () => {
    if (service) await service.from("app_config").update({ value: false }).eq("key", "helper_gender_matching_enabled");
  });

  afterAll(async () => {
    if (identities.length) {
      const { error } = await service.from("phase_a_reports").delete().in("reporter_id", identities.map((identity) => identity.id));
      if (error) throw new Error("Could not remove local-only report fixtures.");
    }
    if (offerExpiryBookingId) await service.from("phase_a_bookings").delete().eq("id", offerExpiryBookingId);
    if (atomicBookingId) await service.from("phase_a_bookings").delete().eq("id", atomicBookingId);
    if (fourSlotBookingId) await service.from("phase_a_bookings").delete().eq("id", fourSlotBookingId);
    if (serviceMismatchBookingId) await service.from("phase_a_bookings").delete().eq("id", serviceMismatchBookingId);
    if (genderPreferenceBookingId) await service.from("phase_a_bookings").delete().eq("id", genderPreferenceBookingId);
    if (softDeletedOfferBookingId) await service.from("phase_a_bookings").delete().eq("id", softDeletedOfferBookingId);
    if (mixPreferenceBookingId) await service.from("phase_a_bookings").delete().eq("id", mixPreferenceBookingId);
    if (completionBookingId) await service.from("phase_a_bookings").delete().eq("id", completionBookingId);
    if (hostOnlyCompletionBookingId) await service.from("phase_a_bookings").delete().eq("id", hostOnlyCompletionBookingId);
    if (autoReleaseBookingIds.length) await service.from("phase_a_bookings").delete().in("id", autoReleaseBookingIds);
    if (overlapBookingIds.length) await service.from("phase_a_bookings").delete().in("id", overlapBookingIds);
    if (cancellationRaceBookingId) await service.from("phase_a_bookings").delete().eq("id", cancellationRaceBookingId);
    if (noShowTransitionBookingId) await service.from("phase_a_bookings").delete().eq("id", noShowTransitionBookingId);
    if (noShowResolutionBookingId) await service.from("phase_a_bookings").delete().eq("id", noShowResolutionBookingId);
    if (noShowSoloResolutionBookingId) await service.from("phase_a_bookings").delete().eq("id", noShowSoloResolutionBookingId);
    if (noShowPendingCheckInBookingId) await service.from("phase_a_bookings").delete().eq("id", noShowPendingCheckInBookingId);
    if (concurrentReopenBookingId) await service.from("phase_a_bookings").delete().eq("id", concurrentReopenBookingId);
    if (helperReopenBookingId) await service.from("phase_a_bookings").delete().eq("id", helperReopenBookingId);
    if (adminReopenBookingId) await service.from("phase_a_bookings").delete().eq("id", adminReopenBookingId);
    if (invalidHostBookingId) await service.from("phase_a_bookings").delete().eq("id", invalidHostBookingId);
    if (assignmentBookingId) await service.from("phase_a_bookings").delete().eq("id", assignmentBookingId);
    if (bookingId) await service.from("phase_a_bookings").delete().eq("id", bookingId);
    for (const identity of identities) await service.auth.admin.deleteUser(identity.id);
    for (const client of roleClients.values()) await client.auth.signOut();
  }, 30_000);

  it("allows a host to select their own booking row", async () => {
    const host = roleClients.get("host");
    expect(host).toBeDefined();
    const { data, error } = await host!.from("phase_a_bookings").select("id, address_line").eq("id", bookingId).maybeSingle();
    expect(error).toBeNull();
    expect(data?.address_line).toBe("1 Local Test Street");
  });

  it("denies a different host and a helper through RLS", async () => {
    const otherHost = roleClients.get("wrong-host");
    expect(otherHost).toBeDefined();
    const { data: otherHostData, error: otherHostError } = await otherHost!.from("phase_a_bookings").select("id, address_line").eq("id", bookingId).maybeSingle();
    expect(otherHostError).toBeNull();
    expect(otherHostData).toBeNull();

    const config = localConfig();
    const anonymous = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: anonymousData } = await anonymous.from("phase_a_bookings").select("id, address_line").eq("id", bookingId).maybeSingle();
    expect(anonymousData).toBeNull();

    const helper = roleClients.get("pending-helper");
    expect(helper).toBeDefined();
    const { data, error } = await helper!.from("phase_a_bookings").select("id, address_line").eq("id", bookingId).maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("allows an authenticated admin member to read operational booking data", async () => {
    const admin = roleClients.get("admin");
    expect(admin).toBeDefined();
    const { data, error } = await admin!.from("phase_a_bookings").select("id").eq("id", bookingId).maybeSingle();
    expect(error).toBeNull();
    expect(data?.id).toBe(bookingId);
  });

  it("allows only the host owner and admin member to read host details through RLS", async () => {
    const host = roleClients.get("host");
    const wrongHost = roleClients.get("wrong-host");
    const helper = roleClients.get("helper");
    const admin = roleClients.get("admin");
    const adminProfileOnly = roleClients.get("admin-profile-only");
    const hostIdentity = identities.find((identity) => identity.role === "host");
    expect(host && wrongHost && helper && admin && adminProfileOnly && hostIdentity).toBeTruthy();

    const { data: ownData, error: ownError } = await host!.from("host_details")
      .select("user_id, address_line, suburb, city, notes_default")
      .eq("user_id", hostIdentity!.id).maybeSingle();
    expect(ownError).toBeNull();
    expect(ownData).toMatchObject({ address_line: "10 Local Test Lane", suburb: "Rosebank" });

    for (const client of [wrongHost!, helper!, adminProfileOnly!]) {
      const { data, error } = await client.from("host_details").select("user_id, address_line")
        .eq("user_id", hostIdentity!.id).maybeSingle();
      expect(error).toBeNull();
      expect(data).toBeNull();
    }

    const { data: adminData, error: adminError } = await admin!.from("host_details")
      .select("user_id, address_line").eq("user_id", hostIdentity!.id).maybeSingle();
    expect(adminError).toBeNull();
    expect(adminData?.user_id).toBe(hostIdentity!.id);

    const config = localConfig();
    const anonymous = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: anonymousData } = await anonymous.from("host_details").select("user_id, address_line")
      .eq("user_id", hostIdentity!.id).maybeSingle();
    expect(anonymousData).toBeNull();
  });

  it("keeps profile writes server-only, denies other owners, and preserves unique phones", async () => {
    const host = roleClients.get("host");
    const wrongHost = roleClients.get("wrong-host");
    const hostIdentity = identities.find((identity) => identity.role === "host");
    const wrongHostIdentity = identities.find((identity) => identity.role === "wrong-host");
    expect(host && wrongHost && hostIdentity && wrongHostIdentity).toBeTruthy();
    const updatedPhone = `+2786${Array.from(crypto.getRandomValues(new Uint8Array(7)), (digit) => String(digit % 10)).join("")}`;

    const ownUpdate = await service.from("profiles")
      .update({ first_name: "Updated", last_name: "Host", phone: updatedPhone })
      .eq("id", hostIdentity!.id)
      .select("id, first_name, last_name, phone")
      .maybeSingle();
    expect(ownUpdate.error).toBeNull();
    expect(ownUpdate.data).toMatchObject({ id: hostIdentity!.id, first_name: "Updated", last_name: "Host", phone: updatedPhone });

    const wrongOwner = await wrongHost!.from("profiles")
      .update({ first_name: "Changed by another user" })
      .eq("id", hostIdentity!.id)
      .select("id")
      .maybeSingle();
    expect(wrongOwner.error?.code).toBe("42501");
    expect(wrongOwner.data).toBeNull();

    const { data: otherProfile } = await service.from("profiles").select("phone").eq("id", wrongHostIdentity!.id).single();
    expect(otherProfile?.phone).toBeTruthy();
    const duplicate = await service.from("profiles")
      .update({ phone: otherProfile!.phone })
      .eq("id", hostIdentity!.id)
      .select("id")
      .maybeSingle();
    expect(duplicate.error?.code).toBe("23505");

    const { data: finalProfile } = await service.from("profiles").select("first_name, last_name, phone").eq("id", hostIdentity!.id).single();
    expect(finalProfile).toEqual({ first_name: "Updated", last_name: "Host", phone: updatedPhone });
  });

  it("denies authenticated users direct role and helper approval writes", async () => {
    const host = roleClients.get("host");
    const helper = roleClients.get("helper");
    const hostIdentity = identities.find((identity) => identity.role === "host");
    const helperIdentity = identities.find((identity) => identity.role === "pending-helper");
    expect(host && helper && hostIdentity && helperIdentity).toBeTruthy();

    const roleWrite = await host!.from("profiles").update({ role: "admin" }).eq("id", hostIdentity!.id);
    expect(roleWrite.error).not.toBeNull();
    const statusWrite = await helper!.from("helper_details").update({ status: "approved" }).eq("user_id", helperIdentity!.id);
    expect(statusWrite.error).not.toBeNull();

    const [{ data: profile }, { data: details }] = await Promise.all([
      service.from("profiles").select("role").eq("id", hostIdentity!.id).single(),
      service.from("helper_details").select("status").eq("user_id", helperIdentity!.id).single(),
    ]);
    expect(profile?.role).toBe("host");
    expect(details?.status).toBe("pending");
  });

  it("allows a helper to claim a slot whose previous assignment is no-show history", async () => {
    const helper = identities.find((identity) => identity.role === "helper2");
    expect(helper).toBeDefined();
    const result = await service.rpc("claim_phase_a_slot", {
      p_booking_id: helperReopenBookingId,
      p_helper_id: helper!.id,
      p_slot: 1,
    });
    expect(result.error).toBeNull();
    expect(result.data?.helper_id).toBe(helper!.id);
    const { data: assignments } = await service.from("booking_assignments").select("helper_id, status, slot").eq("booking_id", helperReopenBookingId).order("created_at");
    expect(assignments).toHaveLength(2);
    expect(assignments?.[0]).toMatchObject({ status: "no_show", slot: 1 });
    expect(assignments?.[1]).toMatchObject({ helper_id: helper!.id, status: "accepted", slot: 1 });
  });

  it("allows admin assignment into a slot with a no-show history row", async () => {
    const admin = identities.find((identity) => identity.role === "admin");
    const helper = identities.find((identity) => identity.role === "helper2");
    expect(admin && helper).toBeTruthy();
    const result = await service.rpc("admin_assign_phase_a_helpers", {
      p_actor_id: admin!.id,
      p_booking_id: adminReopenBookingId,
      p_helper_ids: [helper!.id],
    });
    expect(result.error).toBeNull();
    expect(result.data).toBe(1);
    const { data: assignments } = await service.from("booking_assignments").select("helper_id, status, slot").eq("booking_id", adminReopenBookingId).order("created_at");
    expect(assignments).toHaveLength(2);
    expect(assignments?.[0]).toMatchObject({ status: "no_show", slot: 1 });
    expect(assignments?.[1]).toMatchObject({ helper_id: helper!.id, status: "accepted", slot: 1 });
  });

  it("allows at most one concurrent helper claim for a reopened slot", async () => {
    const candidates = identities.filter((identity) => identity.role === "helper2" || identity.role === "helper3");
    expect(candidates).toHaveLength(2);
    const results = await Promise.all(candidates.map((helper) => service.rpc("claim_phase_a_slot", {
      p_booking_id: concurrentReopenBookingId,
      p_helper_id: helper.id,
      p_slot: 1,
    })));
    expect(results.filter((result) => result.error === null)).toHaveLength(1);
    expect(results.filter((result) => result.error !== null)).toHaveLength(1);
    const { data: assignments } = await service.from("booking_assignments").select("status, slot").eq("booking_id", concurrentReopenBookingId);
    expect(assignments).toHaveLength(2);
    expect(assignments?.filter((row) => row.status === "accepted" && row.slot === 1)).toHaveLength(1);
  });

  it("denies direct authenticated calls to the service-only no-show transaction", async () => {
    const hostClient = roleClients.get("host");
    const host = identities.find((identity) => identity.role === "host");
    const absentHelper = identities.find((identity) => identity.role === "helper");
    expect(hostClient && host && absentHelper).toBeTruthy();
    const result = await hostClient!.rpc("record_phase_a_helper_no_show", {
      p_host_id: host!.id, p_booking_id: noShowTransitionBookingId, p_helper_id: absentHelper!.id,
    });
    expect(result.error?.code).toBe("42501");
  });

  it("exposes the database clock only to service-role reads", async () => {
    const before = Date.now();
    const allowed = await service.rpc("get_phase_a_database_now");
    const after = Date.now();
    expect(allowed.error).toBeNull();
    const databaseTime = Date.parse(String(allowed.data));
    expect(databaseTime).toBeGreaterThanOrEqual(before - 5_000);
    expect(databaseTime).toBeLessThanOrEqual(after + 5_000);

    const denied = await roleClients.get("host")!.rpc("get_phase_a_database_now");
    expect(denied.error?.code).toBe("42501");
  });

  it("records a no-show atomically, preserves the other helper, and allows only the reopened slot to be replaced", async () => {
    const host = identities.find((identity) => identity.role === "host");
    const wrongHost = identities.find((identity) => identity.role === "wrong-host");
    const absentHelper = identities.find((identity) => identity.role === "helper");
    const checkedInHelper = identities.find((identity) => identity.role === "helper2");
    const replacementCandidate = identities.find((identity) => identity.role === "helper3");
    const incompleteServiceHelper = identities.find((identity) => identity.role === "helper4");
    expect(host && wrongHost && absentHelper && checkedInHelper && replacementCandidate && incompleteServiceHelper).toBeTruthy();
    const isolatedNoShowHelpers = [absentHelper!.id, checkedInHelper!.id, replacementCandidate!.id, incompleteServiceHelper!.id];
    const { error: isolationError } = await service.from("helper_details").update({ suburbs: [noShowSuburb] }).in("user_id", isolatedNoShowHelpers);
    expect(isolationError).toBeNull();
    const { error: servicesError } = await service.from("helper_details").update({ services: ["home", "garden"] }).eq("user_id", replacementCandidate!.id);
    expect(servicesError).toBeNull();
    const { error: incompleteServicesError } = await service.from("helper_details").update({ services: ["home"] }).eq("user_id", incompleteServiceHelper!.id);
    expect(incompleteServicesError).toBeNull();
    const { error: bookingAreaError } = await service.from("phase_a_bookings").update({ suburb: noShowSuburb, services: ["home", "garden"] }).eq("id", noShowTransitionBookingId);
    expect(bookingAreaError).toBeNull();

    const [{ data: beforeHelper }, { data: initialAudit }] = await Promise.all([
      service.from("helper_details").select("strikes").eq("user_id", absentHelper!.id).single(),
      service.from("phase_a_audit_log").select("id").eq("action", "helper_no_show").eq("entity", "booking_assignments"),
    ]);
    const denied = await service.rpc("record_phase_a_helper_no_show", {
      p_host_id: wrongHost!.id, p_booking_id: noShowTransitionBookingId, p_helper_id: absentHelper!.id,
    });
    expect(denied.error?.code).toBe("P0002");

    const { data: bookingStart } = await service.from("phase_a_bookings").select("start_at").eq("id", noShowTransitionBookingId).single();
    await service.from("phase_a_bookings").update({ start_at: new Date(Date.now() + 60 * 60_000).toISOString() }).eq("id", noShowTransitionBookingId);
    const early = await service.rpc("record_phase_a_helper_no_show", {
      p_host_id: host!.id, p_booking_id: noShowTransitionBookingId, p_helper_id: absentHelper!.id,
    });
    expect(early.error?.code).toBe("P0001");
    await service.from("phase_a_bookings").update({ start_at: bookingStart!.start_at }).eq("id", noShowTransitionBookingId);

    const checkedInDenial = await service.rpc("record_phase_a_helper_no_show", {
      p_host_id: host!.id, p_booking_id: noShowTransitionBookingId, p_helper_id: checkedInHelper!.id,
    });
    expect(checkedInDenial.error?.code).toBe("P0001");

    const calls = await Promise.all([1, 2].map(() => service.rpc("record_phase_a_helper_no_show", {
      p_host_id: host!.id, p_booking_id: noShowTransitionBookingId, p_helper_id: absentHelper!.id,
    })));
    expect(calls.every((call) => call.error === null)).toBe(true);

    const [{ data: booking }, { data: assignments }, { data: afterHelper }, { data: finalAudit }] = await Promise.all([
      service.from("phase_a_bookings").select("status").eq("id", noShowTransitionBookingId).single(),
      service.from("booking_assignments").select("helper_id, slot, status, checked_in_at, no_show_at").eq("booking_id", noShowTransitionBookingId).order("slot"),
      service.from("helper_details").select("strikes").eq("user_id", absentHelper!.id).single(),
      service.from("phase_a_audit_log").select("id").eq("action", "helper_no_show").eq("entity", "booking_assignments"),
    ]);
    expect(booking?.status).toBe("in_progress");
    expect(assignments).toHaveLength(2);
    expect(assignments?.[0]).toMatchObject({ helper_id: absentHelper!.id, slot: 1, status: "no_show" });
    expect(assignments?.[0]?.no_show_at).toBeTruthy();
    expect(assignments?.[1]).toMatchObject({ helper_id: identities.find((identity) => identity.role === "helper2")!.id, slot: 2, status: "accepted" });
    expect(assignments?.[1]?.checked_in_at).toBeTruthy();
    expect(afterHelper?.strikes).toBe(beforeHelper!.strikes + 1);
    expect(finalAudit).toHaveLength(initialAudit!.length + 1);

    const { data: freshOffers } = await service.from("booking_offers")
      .select("helper_id, slot, offer_round, expires_at")
      .eq("booking_id", noShowTransitionBookingId).eq("slot", 1).eq("offer_round", 2);
    expect(freshOffers!.length).toBeGreaterThan(0);
    expect(freshOffers!.every((offer) => offer.slot === 1)).toBe(true);
    expect(freshOffers!.map((offer) => offer.helper_id)).toEqual([replacementCandidate!.id]);
    const { error: expireReoffersError } = await service.from("booking_offers").update({ expires_at: new Date(Date.now() - 1_000).toISOString() })
      .eq("booking_id", noShowTransitionBookingId).eq("slot", 1).eq("offer_round", 2);
    expect(expireReoffersError).toBeNull();

    const incompleteServiceClaim = await service.rpc("claim_phase_a_slot", {
      p_booking_id: noShowTransitionBookingId, p_helper_id: incompleteServiceHelper!.id, p_slot: 1,
    });
    expect(incompleteServiceClaim.error).not.toBeNull();

    const replacementHelper = identities.find((identity) => identity.id === freshOffers![0].helper_id);
    expect(replacementHelper).toBeTruthy();
    const replacement = await service.rpc("claim_phase_a_slot", {
      p_booking_id: noShowTransitionBookingId, p_helper_id: replacementHelper!.id, p_slot: 1,
    });
    expect(replacement.error).toBeNull();
    expect(replacement.data?.slot).toBe(1);
    const { data: afterClaim } = await service.from("phase_a_bookings").select("status").eq("id", noShowTransitionBookingId).single();
    expect(afterClaim?.status).toBe("in_progress");
    const { error: restoreError } = await service.from("helper_details").update({ suburbs: ["Rosebank"] }).in("user_id", isolatedNoShowHelpers);
    expect(restoreError).toBeNull();
    const { error: restoreServicesError } = await service.from("helper_details").update({ services: ["home"] }).eq("user_id", replacementCandidate!.id);
    expect(restoreServicesError).toBeNull();
    const { error: restoreBookingError } = await service.from("phase_a_bookings").update({ services: ["home"] }).eq("id", noShowTransitionBookingId);
    expect(restoreBookingError).toBeNull();
  });

  it("lets the host close only an unfilled no-show slot after recovery time", async () => {
    const host = identities.find((identity) => identity.role === "host");
    const wrongHost = identities.find((identity) => identity.role === "wrong-host");
    const replacement = identities.find((identity) => identity.role === "helper4");
    const remainingHelper = identities.find((identity) => identity.role === "helper2");
    const absentHelper = identities.find((identity) => identity.role === "helper3");
    expect(host && wrongHost && replacement && remainingHelper && absentHelper).toBeTruthy();
    const [{ data: recoveryConfig }, { data: noShowConfig }] = await Promise.all([
      service.from("app_config").select("value").eq("key", "no_show_recovery_minutes").single(),
      service.from("app_config").select("value").eq("key", "no_show_minutes").single(),
    ]);
    const recoveryMinutes = Number(recoveryConfig?.value);
    const noShowMinutes = Number(noShowConfig?.value);
    expect(recoveryMinutes).toBe(60);
    const startAt = new Date(Date.now() - (noShowMinutes + recoveryMinutes + 10) * 60_000);
    const endAt = new Date(startAt.getTime() + 3 * 60 * 60_000);
    const { data: booking, error: bookingError } = await service.from("phase_a_bookings").insert({
      host_id: host!.id, address_line: "17 Local Test Lane", suburb: "Rosebank", city: "Johannesburg",
      services: ["home"], helpers_needed: 2, status: "in_progress", start_at: startAt.toISOString(),
      end_at_est: endAt.toISOString(), pay_per_helper_cents: 10000, transport_per_helper_cents: 1000,
      idempotency_key: crypto.randomUUID(),
    }).select("id").single();
    expect(bookingError).toBeNull();
    expect(booking).toBeTruthy();
    noShowResolutionBookingId = booking!.id;
    const recoveryWindowStarted = new Date(Date.now() - Math.max(1, recoveryMinutes - 30) * 60_000);
    const { error: assignmentError } = await service.from("booking_assignments").insert([
      { booking_id: booking!.id, helper_id: absentHelper!.id, slot: 1, status: "no_show", no_show_at: recoveryWindowStarted.toISOString() },
      { booking_id: booking!.id, helper_id: remainingHelper!.id, slot: 2, status: "accepted", checked_in_at: new Date(startAt.getTime() + noShowMinutes * 60_000).toISOString() },
    ]);
    expect(assignmentError).toBeNull();

    const hiddenRead = await roleClients.get("host")!.rpc("get_phase_a_host_no_show_slots", { p_host_id: host!.id, p_booking_id: booking!.id });
    expect(hiddenRead.error?.code).toBe("42501");
    const wrongOwnerRead = await service.rpc("get_phase_a_host_no_show_slots", { p_host_id: wrongHost!.id, p_booking_id: booking!.id });
    expect(wrongOwnerRead.error?.code).toBe("P0002");
    const earlyRead = await service.rpc("get_phase_a_host_no_show_slots", { p_host_id: host!.id, p_booking_id: booking!.id });
    expect(earlyRead.error).toBeNull();
    expect(earlyRead.data?.[0]).toMatchObject({ slot: 1, resolution: null, recovery_minutes: 60, can_resolve: false });

    const wrongOwner = await service.rpc("resolve_phase_a_no_show_slot", {
      p_host_id: wrongHost!.id, p_booking_id: booking!.id, p_slot: 1, p_resolution: "close_vacant_slot",
    });
    expect(wrongOwner.error?.code).toBe("P0002");
    const directHost = await roleClients.get("host")!.rpc("resolve_phase_a_no_show_slot", {
      p_host_id: host!.id, p_booking_id: booking!.id, p_slot: 1, p_resolution: "close_vacant_slot",
    });
    expect(directHost.error?.code).toBe("42501");

    const early = await service.rpc("resolve_phase_a_no_show_slot", {
      p_host_id: host!.id, p_booking_id: booking!.id, p_slot: 1, p_resolution: "close_vacant_slot",
    });
    expect(early.error?.code).toBe("P0001");

    const { error: elapsedError } = await service.from("booking_assignments").update({ no_show_at: new Date(Date.now() - (recoveryMinutes + 1) * 60_000).toISOString() })
      .eq("booking_id", booking!.id).eq("slot", 1).eq("status", "no_show");
    expect(elapsedError).toBeNull();
    const readyRead = await service.rpc("get_phase_a_host_no_show_slots", { p_host_id: host!.id, p_booking_id: booking!.id });
    expect(readyRead.error).toBeNull();
    expect(readyRead.data?.[0]).toMatchObject({ can_resolve: true, can_proceed_with_fewer: true });
    const resolutions = await Promise.all([1, 2].map(() => service.rpc("resolve_phase_a_no_show_slot", {
      p_host_id: host!.id, p_booking_id: booking!.id, p_slot: 1, p_resolution: "close_vacant_slot",
    })));
    expect(resolutions.every((result) => result.error === null)).toBe(true);
    const changedChoice = await service.rpc("resolve_phase_a_no_show_slot", {
      p_host_id: host!.id, p_booking_id: booking!.id, p_slot: 1, p_resolution: "proceed_fewer",
    });
    expect(changedChoice.error?.code).toBe("P0001");
    const [{ data: finalBooking }, { data: assignments }] = await Promise.all([
      service.from("phase_a_bookings").select("status").eq("id", booking!.id).single(),
      service.from("booking_assignments").select("id, helper_id, slot, status, no_show_resolution, no_show_resolved_at, checked_in_at").eq("booking_id", booking!.id).order("slot"),
    ]);
    expect(finalBooking?.status).toBe("in_progress");
    expect(assignments?.[0]).toMatchObject({ helper_id: absentHelper!.id, slot: 1, status: "no_show", no_show_resolution: "close_vacant_slot" });
    expect(assignments?.[0]?.no_show_resolved_at).toBeTruthy();
    expect(assignments?.[1]).toMatchObject({ helper_id: remainingHelper!.id, slot: 2, status: "accepted" });
    const { data: resolutionEvents } = await service.from("phase_a_audit_log").select("id").eq("action", "helper_no_show_slot_resolved").eq("entity", "booking_assignments").eq("entity_id", assignments![0]!.id);
    expect(resolutionEvents).toHaveLength(1);
    const closedClaim = await service.rpc("claim_phase_a_slot", { p_booking_id: booking!.id, p_helper_id: replacement!.id, p_slot: 1 });
    expect(closedClaim.error?.message).toContain("slot_closed");

    const local = localConfig();
    const freshHelper = await createIdentity("helper", local.anonKey, local.url, "helper10");
    const { error: freshHelperDetailsError } = await service.from("helper_details").insert({
      user_id: freshHelper.id,
      date_of_birth: "1990-01-01",
      job_title: "Local offer guard helper",
      services: ["home"],
      suburbs: ["Rosebank"],
      status: "approved",
    });
    expect(freshHelperDetailsError).toBeNull();
    const reopenedResolvedSlot = await service.rpc("create_phase_a_no_show_offers", {
      p_booking_id: booking!.id,
      p_slot: 1,
      p_now: new Date().toISOString(),
      p_offer_minutes: 10,
    });
    expect(reopenedResolvedSlot.error?.code).toBe("P0001");
    expect(reopenedResolvedSlot.error?.message).toContain("no_show_slot_unavailable");
    const helper10Client = roleClients.get("helper10");
    if (helper10Client) await helper10Client.auth.signOut();
    roleClients.delete("helper10");
    const { error: helperDeleteError } = await service.auth.admin.deleteUser(freshHelper.id);
    expect(helperDeleteError).toBeNull();
    const helper10Index = identities.findIndex((identity) => identity.id === freshHelper.id);
    if (helper10Index >= 0) identities.splice(helper10Index, 1);

    const { data: soloBooking, error: soloBookingError } = await service.from("phase_a_bookings").insert({
      host_id: host!.id, address_line: "18 Local Test Lane", suburb: "Rosebank", city: "Johannesburg", services: ["home"],
      helpers_needed: 1, status: "open", start_at: startAt.toISOString(), end_at_est: endAt.toISOString(),
      pay_per_helper_cents: 10000, transport_per_helper_cents: 1000, idempotency_key: crypto.randomUUID(),
    }).select("id").single();
    expect(soloBookingError).toBeNull();
    noShowSoloResolutionBookingId = soloBooking!.id;
    const { error: soloAssignmentError } = await service.from("booking_assignments").insert({
      booking_id: soloBooking!.id, helper_id: absentHelper!.id, slot: 1, status: "no_show",
      no_show_at: new Date(Date.now() - (recoveryMinutes + 1) * 60_000).toISOString(),
    });
    expect(soloAssignmentError).toBeNull();
    const soloRead = await service.rpc("get_phase_a_host_no_show_slots", { p_host_id: host!.id, p_booking_id: soloBooking!.id });
    expect(soloRead.error).toBeNull();
    expect(soloRead.data?.[0]).toMatchObject({ can_resolve: true, can_proceed_with_fewer: false });
    const noHelperContinue = await service.rpc("resolve_phase_a_no_show_slot", {
      p_host_id: host!.id, p_booking_id: soloBooking!.id, p_slot: 1, p_resolution: "proceed_fewer",
    });
    expect(noHelperContinue.error?.code).toBe("P0001");
    const closeLastSlot = await service.rpc("resolve_phase_a_no_show_slot", {
      p_host_id: host!.id, p_booking_id: soloBooking!.id, p_slot: 1, p_resolution: "close_vacant_slot",
    });
    expect(closeLastSlot.error).toBeNull();
    const { data: soloFinal } = await service.from("phase_a_bookings").select("status").eq("id", soloBooking!.id).single();
    expect(soloFinal?.status).toBe("cancelled");
  });

  it("keeps the remaining helper's booking assigned while reopening only the no-show slot", async () => {
    const host = identities.find((identity) => identity.role === "host");
    const absent = identities.find((identity) => identity.role === "helper3");
    const remaining = identities.find((identity) => identity.role === "helper2");
    expect(host && absent && remaining).toBeTruthy();
    const { data: config } = await service.from("app_config").select("value").eq("key", "no_show_minutes").single();
    const startAt = new Date(Date.now() - (Number(config?.value) + 5) * 60_000);
    const { data: booking, error } = await service.from("phase_a_bookings").insert({
      host_id: host!.id, address_line: "19 Local Test Lane", suburb: "Rosebank", city: "Johannesburg", services: ["home"],
      helpers_needed: 2, status: "assigned", start_at: startAt.toISOString(), end_at_est: new Date(startAt.getTime() + 3 * 60 * 60_000).toISOString(),
      pay_per_helper_cents: 10000, transport_per_helper_cents: 1000, idempotency_key: crypto.randomUUID(),
    }).select("id").single();
    expect(error).toBeNull();
    noShowPendingCheckInBookingId = booking!.id;
    const { error: assignmentError } = await service.from("booking_assignments").insert([
      { booking_id: booking!.id, helper_id: absent!.id, slot: 1, status: "accepted" },
      { booking_id: booking!.id, helper_id: remaining!.id, slot: 2, status: "accepted" },
    ]);
    expect(assignmentError).toBeNull();

    const result = await service.rpc("record_phase_a_helper_no_show_with_assignment_state", {
      p_host_id: host!.id, p_booking_id: booking!.id, p_helper_id: absent!.id,
    });
    expect(result.error).toBeNull();
    const authenticatedAttempt = await roleClients.get("host")!.rpc("record_phase_a_helper_no_show_with_assignment_state", {
      p_host_id: host!.id, p_booking_id: booking!.id, p_helper_id: absent!.id,
    });
    expect(authenticatedAttempt.error?.code).toBe("42501");
    const [{ data: finalBooking }, { data: assignments }, { data: offers }] = await Promise.all([
      service.from("phase_a_bookings").select("status").eq("id", booking!.id).single(),
      service.from("booking_assignments").select("helper_id, slot, status, checked_in_at").eq("booking_id", booking!.id).order("slot"),
      service.from("booking_offers").select("helper_id, slot").eq("booking_id", booking!.id).eq("offer_round", 2),
    ]);
    expect(finalBooking?.status).toBe("assigned");
    expect(assignments?.[0]).toMatchObject({ helper_id: absent!.id, slot: 1, status: "no_show" });
    expect(assignments?.[1]).toMatchObject({ helper_id: remaining!.id, slot: 2, status: "accepted" });
    expect(offers!.length).toBeGreaterThan(0);
    expect(offers!.every((offer) => offer.slot === 1)).toBe(true);
    const replacement = offers![0];
    expect(replacement?.helper_id).toBeTruthy();
    const replacementClaim = await service.rpc("claim_phase_a_slot", { p_booking_id: booking!.id, p_helper_id: replacement!.helper_id, p_slot: 1 });
    expect(replacementClaim.error).toBeNull();
    const { data: afterReplacement } = await service.from("phase_a_bookings").select("status").eq("id", booking!.id).single();
    expect(afterReplacement?.status).toBe("assigned");
  });

  it("opens every slot after the booking's earliest offer expires", async () => {
    const target = identities.find((identity) => identity.role === "helper3");
    const claimant = identities.find((identity) => identity.role === "helper2");
    expect(target && claimant).toBeTruthy();
    const now = Date.now();
    const { error: offerError } = await service.from("booking_offers").insert([
      { booking_id: offerExpiryBookingId, helper_id: target!.id, slot: 1, expires_at: new Date(now - 60_000).toISOString() },
      { booking_id: offerExpiryBookingId, helper_id: target!.id, slot: 2, expires_at: new Date(now + 60_000).toISOString() },
    ]);
    expect(offerError).toBeNull();

    const claim = await service.rpc("claim_phase_a_slot", { p_booking_id: offerExpiryBookingId, p_helper_id: claimant!.id, p_slot: 2 });
    expect(claim.error).toBeNull();
  });

  it("does not let a slot claim reopen a booking cancelled at the same time", async () => {
    const admin = identities.find((identity) => identity.role === "admin");
    const helper = identities.find((identity) => identity.role === "helper2");
    expect(admin && helper).toBeTruthy();
    const [claim, cancellation] = await Promise.all([
      service.rpc("claim_phase_a_slot", { p_booking_id: cancellationRaceBookingId, p_helper_id: helper!.id, p_slot: 1 }),
      service.rpc("admin_set_phase_a_booking_status", { p_actor_id: admin!.id, p_booking_id: cancellationRaceBookingId, p_next_status: "cancelled" }),
    ]);
    expect(cancellation.error).toBeNull();
    const [{ data: booking }, { data: assignments }] = await Promise.all([
      service.from("phase_a_bookings").select("status").eq("id", cancellationRaceBookingId).single(),
      service.from("booking_assignments").select("status").eq("booking_id", cancellationRaceBookingId),
    ]);
    expect(booking?.status).toBe("cancelled");
    expect(assignments?.every((assignment) => assignment.status !== "accepted")).toBe(true);
    if (claim.error) expect(claim.error.message).toContain("slot_unavailable");
  });

  it("rejects non-admin assignment and rolls back every row when a later helper is ineligible", async () => {
    const admin = identities.find((identity) => identity.role === "admin");
    const wrongHost = identities.find((identity) => identity.role === "wrong-host");
    const adminProfileOnly = identities.find((identity) => identity.role === "admin-profile-only");
    const helper = identities.find((identity) => identity.role === "helper");
    const pendingHelper = identities.find((identity) => identity.role === "pending-helper");
    expect(admin && wrongHost && adminProfileOnly && helper && pendingHelper).toBeTruthy();

    const denied = await service.rpc("admin_assign_phase_a_helpers", {
      p_actor_id: wrongHost!.id,
      p_booking_id: assignmentBookingId,
      p_helper_ids: [helper!.id],
    });
    expect(denied.error).not.toBeNull();

    const unlistedAdminDenied = await service.rpc("admin_assign_phase_a_helpers", {
      p_actor_id: adminProfileOnly!.id,
      p_booking_id: assignmentBookingId,
      p_helper_ids: [helper!.id],
    });
    expect(unlistedAdminDenied.error).not.toBeNull();

    const config = localConfig();
    const anonymous = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const anonymousDenied = await anonymous.rpc("admin_assign_phase_a_helpers", {
      p_actor_id: admin!.id,
      p_booking_id: assignmentBookingId,
      p_helper_ids: [helper!.id],
    });
    expect(anonymousDenied.error).not.toBeNull();

    const authenticatedNonAdmin = roleClients.get("wrong-host");
    const authenticatedDenied = await authenticatedNonAdmin!.rpc("admin_assign_phase_a_helpers", {
      p_actor_id: admin!.id,
      p_booking_id: assignmentBookingId,
      p_helper_ids: [helper!.id],
    });
    expect(authenticatedDenied.error).not.toBeNull();

    const malformedSelections = await Promise.all([
      service.rpc("admin_assign_phase_a_helpers", {
        p_actor_id: admin!.id,
        p_booking_id: assignmentBookingId,
        p_helper_ids: [helper!.id, helper!.id],
      }),
      service.rpc("admin_assign_phase_a_helpers", {
        p_actor_id: admin!.id,
        p_booking_id: assignmentBookingId,
        p_helper_ids: [helper!.id, null] as unknown as string[],
      }),
      service.rpc("admin_assign_phase_a_helpers", {
        p_actor_id: admin!.id,
        p_booking_id: assignmentBookingId,
        p_helper_ids: Array.from({ length: 5 }, () => crypto.randomUUID()),
      }),
    ]);
    expect(malformedSelections.every((result) => result.error !== null)).toBe(true);

    const partial = await service.rpc("admin_assign_phase_a_helpers", {
      p_actor_id: admin!.id,
      p_booking_id: assignmentBookingId,
      p_helper_ids: [helper!.id, pendingHelper!.id],
    });
    expect(partial.error).not.toBeNull();

    const [{ count: assignmentCount }, { count: auditCount }, { data: booking }] = await Promise.all([
      service.from("booking_assignments").select("id", { count: "exact", head: true }).eq("booking_id", assignmentBookingId),
      service.from("phase_a_audit_log").select("id", { count: "exact", head: true }).eq("entity_id", assignmentBookingId),
      service.from("phase_a_bookings").select("status").eq("id", assignmentBookingId).single(),
    ]);
    expect(assignmentCount).toBe(0);
    expect(auditCount).toBe(0);
    expect(booking?.status).toBe("open");
  });

  it("assigns all selected eligible helpers and audits the operation atomically", async () => {
    const admin = identities.find((identity) => identity.role === "admin");
    const helpers = identities.filter((identity) => identity.role === "helper" || identity.role === "helper2");
    expect(admin).toBeDefined();
    expect(helpers).toHaveLength(2);

    const { data, error } = await service.rpc("admin_assign_phase_a_helpers", {
      p_actor_id: admin!.id,
      p_booking_id: assignmentBookingId,
      p_helper_ids: helpers.map((helper) => helper.id),
    });
    expect(error).toBeNull();
    expect(data).toBe(2);

    const [{ data: assignments, error: assignmentError }, { data: auditRows, error: auditError }, { data: booking }] = await Promise.all([
      service.from("booking_assignments").select("helper_id, slot").eq("booking_id", assignmentBookingId).order("slot"),
      service.from("phase_a_audit_log").select("actor_id, action").eq("entity_id", assignmentBookingId),
      service.from("phase_a_bookings").select("status").eq("id", assignmentBookingId).single(),
    ]);
    expect(assignmentError).toBeNull();
    expect(auditError).toBeNull();
    expect(assignments).toHaveLength(2);
    expect(assignments?.map((row) => row.slot)).toEqual([1, 2]);
    expect(auditRows).toEqual([{ actor_id: admin!.id, action: "helpers_assigned" }]);
    expect(booking?.status).toBe("assigned");
  });

  it("rejects assignments when the booking owner does not have the host role", async () => {
    const admin = identities.find((identity) => identity.role === "admin");
    const helper = identities.find((identity) => identity.role === "helper2");
    expect(admin && helper).toBeTruthy();
    const result = await service.rpc("admin_assign_phase_a_helpers", {
      p_actor_id: admin!.id,
      p_booking_id: invalidHostBookingId,
      p_helper_ids: [helper!.id],
    });
    expect(result.error).not.toBeNull();
    const { count } = await service.from("booking_assignments").select("id", { count: "exact", head: true }).eq("booking_id", invalidHostBookingId);
    expect(count).toBe(0);
  });

  it("cancels accepted assignments atomically with an assigned booking and audit", async () => {
    const admin = identities.find((identity) => identity.role === "admin");
    expect(admin).toBeDefined();
    const result = await service.rpc("admin_set_phase_a_booking_status", {
      p_actor_id: admin!.id,
      p_booking_id: assignmentBookingId,
      p_next_status: "cancelled",
    });
    expect(result.error).toBeNull();
    const [{ data: booking }, { data: assignments }, { data: auditRows }] = await Promise.all([
      service.from("phase_a_bookings").select("status").eq("id", assignmentBookingId).single(),
      service.from("booking_assignments").select("status").eq("booking_id", assignmentBookingId),
      service.from("phase_a_audit_log").select("action").eq("entity_id", assignmentBookingId),
    ]);
    expect(booking?.status).toBe("cancelled");
    expect(assignments).toHaveLength(2);
    expect(assignments?.every((row) => row.status === "cancelled")).toBe(true);
    expect(auditRows?.map((row) => row.action)).toEqual(["helpers_assigned", "booking_cancelled"]);
  });

  it("changes only valid admin booking states with the audit row in the same transaction", async () => {
    const admin = identities.find((identity) => identity.role === "admin");
    const wrongHost = identities.find((identity) => identity.role === "wrong-host");
    expect(admin && wrongHost).toBeTruthy();

    const denied = await service.rpc("admin_set_phase_a_booking_status", {
      p_actor_id: wrongHost!.id,
      p_booking_id: bookingId,
      p_next_status: "cancelled",
    });
    expect(denied.error).not.toBeNull();

    const invalid = await service.rpc("admin_set_phase_a_booking_status", {
      p_actor_id: admin!.id,
      p_booking_id: bookingId,
      p_next_status: "assigned",
    });
    expect(invalid.error).not.toBeNull();

    const changed = await service.rpc("admin_set_phase_a_booking_status", {
      p_actor_id: admin!.id,
      p_booking_id: bookingId,
      p_next_status: "cancelled",
    });
    expect(changed.error).toBeNull();
    expect(changed.data).toBe(true);

    const [{ data: booking }, { data: auditRows }] = await Promise.all([
      service.from("phase_a_bookings").select("status").eq("id", bookingId).single(),
      service.from("phase_a_audit_log").select("actor_id, action").eq("entity_id", bookingId),
    ]);
    expect(booking?.status).toBe("cancelled");
    expect(auditRows).toEqual([{ actor_id: admin!.id, action: "booking_cancelled" }]);
  });

  it("changes helper approval state and records its admin audit entry atomically", async () => {
    const admin = identities.find((identity) => identity.role === "admin");
    const wrongHost = identities.find((identity) => identity.role === "wrong-host");
    const helper = identities.find((identity) => identity.role === "pending-helper");
    expect(admin && wrongHost && helper).toBeTruthy();

    const denied = await service.rpc("admin_review_helper", {
      p_actor_id: wrongHost!.id, p_helper_id: helper!.id, p_action: "approve", p_reason: null,
    });
    expect(denied.error).not.toBeNull();
    const { data: unchanged } = await service.from("helper_details").select("status").eq("user_id", helper!.id).single();
    expect(unchanged?.status).toBe("pending");

    const changed = await service.rpc("admin_review_helper", {
      p_actor_id: admin!.id, p_helper_id: helper!.id, p_action: "approve", p_reason: null,
    });
    expect(changed.error).toBeNull();
    expect(changed.data).toBe(true);
    const replay = await service.rpc("admin_review_helper", {
      p_actor_id: admin!.id, p_helper_id: helper!.id, p_action: "approve", p_reason: null,
    });
    expect(replay.error).toBeNull();
    expect(replay.data).toBe(false);

    const [{ data: reviewed }, { data: auditRows }] = await Promise.all([
      service.from("helper_details").select("status, vetted_at, approved_at, id_number_encrypted").eq("user_id", helper!.id).single(),
      service.from("phase_a_audit_log").select("actor_id, action, entity").eq("entity_id", helper!.id),
    ]);
    expect(reviewed?.status).toBe("approved");
    expect(reviewed?.vetted_at).toBeTruthy();
    expect(reviewed?.approved_at).toBeTruthy();
    expect(reviewed?.id_number_encrypted).toBeNull();
    expect(auditRows).toEqual([{ actor_id: admin!.id, action: "helper_approved", entity: "helper_details" }]);
  });

  it("allows admins to read audit events while hosts and helpers see none", async () => {
    const adminClient = roleClients.get("admin");
    const hostClient = roleClients.get("host");
    const helperClient = roleClients.get("helper");
    expect(adminClient && hostClient && helperClient).toBeTruthy();
    const [adminRead, hostRead, helperRead] = await Promise.all([
      adminClient!.from("phase_a_audit_log").select("id").limit(10),
      hostClient!.from("phase_a_audit_log").select("id").limit(10),
      helperClient!.from("phase_a_audit_log").select("id").limit(10),
    ]);
    expect(adminRead.error).toBeNull();
    expect(adminRead.data!.length).toBeGreaterThan(0);
    expect(hostRead).toMatchObject({ data: [], error: null });
    expect(helperRead).toMatchObject({ data: [], error: null });
  });

  it("creates reports idempotently for a booking participant and hides wrong-owner bookings", async () => {
    const host = identities.find((identity) => identity.role === "host");
    const otherHost = identities.find((identity) => identity.role === "wrong-host");
    if (!host || !otherHost) throw new Error("Local report identities are unavailable.");

    const key = crypto.randomUUID();
    const input = {
      p_reporter_id: host.id,
      p_booking_id: bookingId,
      p_subject_id: null,
      p_category: "other",
      p_text: "Synthetic local report replay test.",
      p_idempotency_key: key,
    };
    const first = await service.rpc("create_phase_a_report", input);
    const replay = await service.rpc("create_phase_a_report", input);
    expect(first.error).toBeNull();
    expect(replay.error).toBeNull();
    expect(replay.data).toBe(first.data);

    const { count, error: countError } = await service.from("phase_a_reports")
      .select("id", { count: "exact", head: true })
      .eq("reporter_id", host.id)
      .eq("idempotency_key", key);
    expect(countError).toBeNull();
    expect(count).toBe(1);

    const wrongOwner = await service.rpc("create_phase_a_report", {
      ...input,
      p_reporter_id: otherHost.id,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(wrongOwner.error?.code).toBe("P0002");

    const adminProfileOnly = identities.find((identity) => identity.role === "admin-profile-only");
    if (!adminProfileOnly) throw new Error("Local admin profile-only identity is unavailable.");
    const wrongRole = await service.rpc("create_phase_a_report", {
      ...input,
      p_reporter_id: adminProfileOnly.id,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(wrongRole.error?.code).toBe("P0002");
  });

  it("creates a host booking and its offers atomically and returns the same row on replay", async () => {
    const host = identities.find((identity) => identity.role === "host");
    const helper = identities.find((identity) => identity.role === "helper");
    if (!host || !helper) throw new Error("Local booking identities are unavailable.");
    const idempotencyKey = crypto.randomUUID();
    const failedKey = crypto.randomUUID();
    const startAt = new Date(Date.now() + 7 * 86_400_000);
    const request = {
      p_host_id: host.id,
      p_address_line: "3 Atomic Test Street",
      p_suburb: "Rosebank",
      p_city: "Johannesburg",
      p_services: ["home"],
      p_helpers_needed: 1,
      p_start_at: startAt.toISOString(),
      p_end_at_est: new Date(startAt.getTime() + 60 * 60_000).toISOString(),
      p_estimated_minutes: 60,
      p_estimate_inputs: { primaryService: "home", services: ["home"], bedrooms: 1, bathrooms: 1, sizeBand: "small", addons: [] },
      p_gender_pref: "any",
      p_pay_per_helper_cents: 10000,
      p_transport_per_helper_cents: 1000,
      p_access_notes: "Synthetic local transaction test.",
      p_idempotency_key: idempotencyKey,
      p_offer_minutes: 10,
    };
    const failed = await service.rpc("create_phase_a_booking_with_offers", {
      ...request,
      p_services: ["home", "laundry"],
      p_idempotency_key: failedKey,
    });
    expect(failed.error).not.toBeNull();
    const { count: rolledBackCount, error: rollbackCountError } = await service.from("phase_a_bookings")
      .select("id", { count: "exact", head: true })
      .eq("host_id", host.id)
      .eq("idempotency_key", failedKey);
    expect(rollbackCountError).toBeNull();
    expect(rolledBackCount).toBe(0);

    const [first, replay] = await Promise.all([
      service.rpc("create_phase_a_booking_with_offers", request),
      service.rpc("create_phase_a_booking_with_offers", request),
    ]);
    expect(first.error).toBeNull();
    expect(replay.error).toBeNull();
    expect(replay.data?.[0]?.id).toBe(first.data?.[0]?.id);
    atomicBookingId = first.data?.[0]?.id ?? "";
    const { data: offers, error: offerError } = await service.from("booking_offers")
      .select("id")
      .eq("booking_id", first.data?.[0]?.id);
    expect(offerError).toBeNull();
    expect(offers).toHaveLength(3);

    const fourHelperRequest = { ...request, p_helpers_needed: 4, p_idempotency_key: crypto.randomUUID() };
    const fourHelperResult = await service.rpc("create_phase_a_booking_with_offers", fourHelperRequest);
    expect(fourHelperResult.error).toBeNull();
    fourSlotBookingId = fourHelperResult.data?.[0]?.id ?? "";
    const { data: fourHelperOffers, error: fourHelperOffersError } = await service.from("booking_offers")
      .select("helper_id, slot")
      .eq("booking_id", fourSlotBookingId);
    expect(fourHelperOffersError).toBeNull();
    expect(fourHelperOffers).toHaveLength(12);
    expect(new Set(fourHelperOffers?.map((offer) => offer.helper_id)).size).toBeGreaterThanOrEqual(4);
    for (const slot of [1, 2, 3, 4]) expect(fourHelperOffers?.filter((offer) => offer.slot === slot)).toHaveLength(3);

    const helperIds = identities.filter((identity) => identity.role.startsWith("helper")).map((identity) => identity.id);
    if (helperIds.length !== 9) throw new Error("Local helper identities are unavailable.");
    const { error: lapseError } = await service.from("helper_details").update({
      first_job_completed_at: new Date().toISOString(),
      subscription_status: "lapsed",
      subscription_paid_until: null,
    }).in("user_id", helperIds).select("user_id");
    expect(lapseError).toBeNull();
    const { data: lapsedHelpers } = await service.from("helper_details").select("user_id")
      .in("user_id", helperIds)
      .eq("subscription_status", "lapsed");
    expect(lapsedHelpers).toHaveLength(9);
    const insufficientKey = crypto.randomUUID();
    const insufficientCapacity = await service.rpc("create_phase_a_booking_with_offers", {
      ...request,
      p_suburb: matchingSuburb,
      p_helpers_needed: 4,
      p_idempotency_key: insufficientKey,
    });
    expect(insufficientCapacity.error?.code).toBe("P0001");
    const { count: insufficientCount, error: insufficientCountError } = await service.from("phase_a_bookings")
      .select("id", { count: "exact", head: true })
      .eq("host_id", host.id)
      .eq("idempotency_key", insufficientKey);
    expect(insufficientCountError).toBeNull();
    expect(insufficientCount).toBe(0);
    const { error: restoreError } = await service.from("helper_details").update({
      first_job_completed_at: null,
      subscription_status: "none",
      subscription_paid_until: null,
    }).in("user_id", helperIds);
    expect(restoreError).toBeNull();

    const { data: mismatchBooking, error: mismatchInsertError } = await service.from("phase_a_bookings").insert({
      host_id: host.id,
      address_line: "4 Service Match Test Street",
      suburb: "Rosebank",
      city: "Johannesburg",
      services: ["home", "laundry"],
      helpers_needed: 1,
      start_at: startAt.toISOString(),
      end_at_est: new Date(startAt.getTime() + 60 * 60_000).toISOString(),
      pay_per_helper_cents: 10000,
      transport_per_helper_cents: 1000,
      idempotency_key: crypto.randomUUID(),
    }).select("id").single();
    expect(mismatchInsertError).toBeNull();
    serviceMismatchBookingId = mismatchBooking?.id ?? "";
    const partialServiceClaim = await service.rpc("claim_phase_a_slot", {
      p_booking_id: serviceMismatchBookingId,
      p_helper_id: helper.id,
      p_slot: 1,
    });
    expect(partialServiceClaim.error).not.toBeNull();
    const { count: assignmentsAfterDeniedClaim } = await service.from("booking_assignments")
      .select("id", { count: "exact", head: true }).eq("booking_id", serviceMismatchBookingId);
    expect(assignmentsAfterDeniedClaim).toBe(0);
    const admin = identities.find((identity) => identity.role === "admin");
    if (!admin) throw new Error("Local admin identity is unavailable.");
    const partialServiceAdminAssignment = await service.rpc("admin_assign_phase_a_helpers", {
      p_actor_id: admin.id,
      p_booking_id: serviceMismatchBookingId,
      p_helper_ids: [helper.id],
    });
    expect(partialServiceAdminAssignment.error).not.toBeNull();
  });

  it("ranks opted-in matching groups after fair rotation without filtering other eligible helpers", async () => {
    const host = identities.find((identity) => identity.role === "host");
    const femaleHelpers = identities.filter((identity) => identity.role === "helper6" || identity.role === "helper7");
    const maleHelpers = identities.filter((identity) => identity.role === "helper8" || identity.role === "helper9");
    if (!host || femaleHelpers.length !== 2 || maleHelpers.length !== 2) throw new Error("Local matching fixtures are incomplete.");
    const { error: gateError } = await service.from("app_config").update({ value: true }).eq("key", "helper_gender_matching_enabled");
    expect(gateError).toBeNull();
    for (const [helper, group] of [[femaleHelpers[0]!, "female"], [femaleHelpers[1]!, "female"], [maleHelpers[0]!, "male"], [maleHelpers[1]!, "male"]] as const) {
      const { error } = await service.rpc("set_helper_gender_match_preference", {
        p_helper_id: helper.id,
        p_gender_match_group: group,
        p_consent_version: "gender_matching_v1",
      });
      expect(error).toBeNull();
    }
    const adminMatchingRead = await roleClients.get("admin")!.from("helper_details")
      .select("gender_match_group").eq("user_id", femaleHelpers[0]!.id).maybeSingle();
    expect(adminMatchingRead.error || !adminMatchingRead.data).toBeTruthy();
    const ownHelperForPrivacy = identities.find((identity) => identity.role === "helper6");
    expect(ownHelperForPrivacy?.id).toBe(femaleHelpers[0]!.id);
    const helperMatchingRead = await roleClients.get("helper6")!.from("helper_details")
      .select("gender_match_group").eq("user_id", ownHelperForPrivacy!.id).maybeSingle();
    expect(helperMatchingRead.error || !helperMatchingRead.data).toBeTruthy();
    const { data: matchingRows, error: matchingRowsError } = await service.from("helper_details")
      .select("user_id, gender_match_group, status, suburbs")
      .in("user_id", [...femaleHelpers, ...maleHelpers].map((identity) => identity.id));
    expect(matchingRowsError).toBeNull();
    expect(matchingRows?.filter((row) => row.gender_match_group === "female")).toHaveLength(2);
    expect(matchingRows?.filter((row) => row.gender_match_group === "male")).toHaveLength(2);
    expect(matchingRows?.every((row) => row.status === "approved" && row.suburbs.includes(matchingSuburb))).toBe(true);

    const insertBooking = async (genderPreference: "female" | "mix", helpersNeeded: number) => {
      const { data, error } = await service.from("phase_a_bookings").insert({
        host_id: host.id,
        address_line: "9 Matching Preference Test Street",
        suburb: matchingSuburb,
        city: "Johannesburg",
        services: ["home"],
        helpers_needed: helpersNeeded,
        gender_pref: genderPreference,
        start_at: new Date(Date.now() + 86_400_000).toISOString(),
        end_at_est: new Date(Date.now() + 90_000_000).toISOString(),
        pay_per_helper_cents: 10000,
        transport_per_helper_cents: 1000,
        idempotency_key: crypto.randomUUID(),
      }).select("id").single();
      expect(error).toBeNull();
      return data!.id;
    };

    genderPreferenceBookingId = await insertBooking("female", 1);
    const femaleOffersCreated = await service.rpc("create_phase_a_offers", { p_booking_id: genderPreferenceBookingId, p_offer_minutes: 10 });
    expect(femaleOffersCreated.error).toBeNull();
    const { data: femaleOffers, error: femaleOfferError } = await service.from("booking_offers")
      .select("helper_id")
      .eq("booking_id", genderPreferenceBookingId)
      .eq("slot", 1);
    expect(femaleOfferError).toBeNull();
    expect(femaleOffers).toHaveLength(3);
    expect(femaleOffers?.filter((offer) => femaleHelpers.some((helper) => helper.id === offer.helper_id))).toHaveLength(2);
    expect(femaleOffers?.some((offer) => maleHelpers.some((helper) => helper.id === offer.helper_id))).toBe(true);

    mixPreferenceBookingId = await insertBooking("mix", 2);
    const mixOffersCreated = await service.rpc("create_phase_a_offers", { p_booking_id: mixPreferenceBookingId, p_offer_minutes: 10 });
    expect(mixOffersCreated.error).toBeNull();
    const { data: mixOffers, error: mixOfferError } = await service.from("booking_offers")
      .select("helper_id, slot")
      .eq("booking_id", mixPreferenceBookingId);
    expect(mixOfferError).toBeNull();
    expect(mixOffers).toHaveLength(6);
    expect(mixOffers?.some((offer) => offer.slot === 1 && femaleHelpers.some((helper) => helper.id === offer.helper_id))).toBe(true);
    expect(mixOffers?.some((offer) => offer.slot === 2 && maleHelpers.some((helper) => helper.id === offer.helper_id))).toBe(true);

    const helper = roleClients.get("helper");
    const ownHelper = identities.find((identity) => identity.role === "helper");
    expect(helper).toBeDefined();
    expect(ownHelper).toBeDefined();
    const { data: directWrite, error: directWriteError } = await helper!.from("helper_details")
      .update({ gender_match_group: "female", gender_match_consent_at: new Date().toISOString(), gender_match_consent_version: "gender_matching_v1" })
      .eq("user_id", ownHelper!.id)
      .select("user_id");
    expect(directWriteError || directWrite?.length === 0).toBeTruthy();
  });

  it("keeps helper gender preference collection closed until the privacy gate is enabled", async () => {
    const helper = identities.find((identity) => identity.role === "helper6");
    expect(helper).toBeTruthy();
    const { data: config, error: configError } = await service.from("app_config").select("value").eq("key", "helper_gender_matching_enabled").single();
    expect(configError).toBeNull();
    expect(config?.value).toBe(false);
    const denied = await service.rpc("set_helper_gender_match_preference", {
      p_helper_id: helper!.id, p_gender_match_group: "female", p_consent_version: "gender_matching_v1",
    });
    expect(denied.error?.code).toBe("P0001");
    const clearAllowed = await service.rpc("set_helper_gender_match_preference", {
      p_helper_id: helper!.id, p_gender_match_group: null, p_consent_version: null,
    });
    expect(clearAllowed.error).toBeNull();
  });

  it("does not create initial offers for a soft-deleted helper", async () => {
    const host = identities.find((identity) => identity.role === "host");
    const helpers = identities.filter((identity) => ["helper6", "helper7", "helper8", "helper9"].includes(identity.role));
    const deletedHelper = identities.find((identity) => identity.role === "helper6");
    if (!host || helpers.length !== 4 || !deletedHelper) throw new Error("Local soft-delete offer fixtures are incomplete.");
    const otherHelpers = helpers.filter((helper) => helper.id !== deletedHelper.id).map((helper) => helper.id);
    const [{ error: isolateError }, { error: deleteError }] = await Promise.all([
      service.from("helper_details").update({ suburbs: ["Vanderbijlpark"] }).in("user_id", otherHelpers),
      service.from("profiles").update({ deleted_at: new Date().toISOString() }).eq("id", deletedHelper.id),
    ]);
    expect(isolateError).toBeNull();
    expect(deleteError).toBeNull();

    try {
      const { data: booking, error: bookingError } = await service.from("phase_a_bookings").insert({
        host_id: host.id,
        address_line: "10 Deleted Helper Offer Test Street",
        suburb: matchingSuburb,
        city: "Johannesburg",
        services: ["home"],
        helpers_needed: 1,
        start_at: new Date(Date.now() + 86_400_000).toISOString(),
        end_at_est: new Date(Date.now() + 90_000_000).toISOString(),
        pay_per_helper_cents: 10000,
        transport_per_helper_cents: 1000,
        idempotency_key: crypto.randomUUID(),
      }).select("id").single();
      expect(bookingError).toBeNull();
      softDeletedOfferBookingId = booking!.id;

      const offersCreated = await service.rpc("create_phase_a_offers", { p_booking_id: booking!.id, p_offer_minutes: 10 });
      expect(offersCreated.error).toBeNull();
      expect(offersCreated.data).toBe(0);
      const { data: offers, error: offersError } = await service.from("booking_offers").select("helper_id").eq("booking_id", booking!.id);
      expect(offersError).toBeNull();
      expect(offers).toEqual([]);
    } finally {
      await service.from("profiles").update({ deleted_at: null }).eq("id", deletedHelper.id);
      await service.from("helper_details").update({ suburbs: [matchingSuburb] }).in("user_id", otherHelpers);
    }
  });

  it("excludes helpers with overlapping accepted jobs from offers and claims, including concurrent requests", async () => {
    const host = identities.find((identity) => identity.role === "host");
    const admin = identities.find((identity) => identity.role === "admin");
    const helper = identities.find((identity) => identity.role === "helper6");
    expect(host && admin && helper).toBeTruthy();
    const suburb = `Overlap${crypto.randomUUID().replaceAll("-", "")}`;
    const { error: helperUpdateError } = await service.from("helper_details").update({ suburbs: [suburb] }).eq("user_id", helper!.id);
    expect(helperUpdateError).toBeNull();

    const insertBooking = async (start: Date, status: "open" | "assigned" = "open") => {
      const { data, error } = await service.from("phase_a_bookings").insert({
        host_id: host!.id,
        address_line: "11 Overlap Test Street",
        suburb,
        city: "Johannesburg",
        services: ["home"],
        helpers_needed: 1,
        start_at: start.toISOString(),
        end_at_est: new Date(start.getTime() + 2 * 60 * 60_000).toISOString(),
        pay_per_helper_cents: 10000,
        transport_per_helper_cents: 1000,
        idempotency_key: crypto.randomUUID(),
        status,
      }).select("id").single();
      expect(error).toBeNull();
      overlapBookingIds.push(data!.id);
      return data!.id;
    };

    const base = Date.now() + 86_400_000;
    const assignedBookingId = await insertBooking(new Date(base), "assigned");
    const { error: assignmentError } = await service.from("booking_assignments").insert({
      booking_id: assignedBookingId,
      helper_id: helper!.id,
      slot: 1,
      status: "accepted",
    });
    expect(assignmentError).toBeNull();

    const overlapsExisting = await insertBooking(new Date(base + 60 * 60_000));
    const offer = await service.rpc("create_phase_a_offers", { p_booking_id: overlapsExisting, p_offer_minutes: 10 });
    expect(offer.error).toBeNull();
    expect(offer.data).toBe(0);
    const claimWhileBusy = await service.rpc("claim_phase_a_slot", { p_booking_id: overlapsExisting, p_helper_id: helper!.id, p_slot: 1 });
    expect(claimWhileBusy.error).not.toBeNull();

    const adminAssignWhileBusy = await service.rpc("admin_assign_phase_a_helpers", {
      p_actor_id: admin!.id,
      p_booking_id: overlapsExisting,
      p_helper_ids: [helper!.id],
    });
    expect(adminAssignWhileBusy.error).not.toBeNull();
    const { data: noRejectedAssignment } = await service.from("booking_assignments")
      .select("id").eq("booking_id", overlapsExisting).eq("helper_id", helper!.id);
    expect(noRejectedAssignment).toHaveLength(0);

    const nonOverlapping = await insertBooking(new Date(base + 3 * 60 * 60_000));
    const nonOverlapOffer = await service.rpc("create_phase_a_offers", { p_booking_id: nonOverlapping, p_offer_minutes: 10 });
    expect(nonOverlapOffer.error).toBeNull();
    const { data: nonOverlapRows } = await service.from("booking_offers").select("helper_id").eq("booking_id", nonOverlapping);
    expect(nonOverlapRows?.some((row) => row.helper_id === helper!.id)).toBe(true);

    const { error: releaseBusyHelperError } = await service.from("booking_assignments").update({ status: "cancelled" })
      .eq("booking_id", assignedBookingId).eq("helper_id", helper!.id);
    expect(releaseBusyHelperError).toBeNull();
    const parallelStart = new Date(base + 5 * 60 * 60_000);
    const parallelBookingA = await insertBooking(parallelStart);
    const parallelBookingB = await insertBooking(new Date(parallelStart.getTime() + 30 * 60_000));
    const claims = await Promise.all([parallelBookingA, parallelBookingB].map((bookingId) => service.rpc("claim_phase_a_slot", {
      p_booking_id: bookingId,
      p_helper_id: helper!.id,
      p_slot: 1,
    })));
    expect(claims.filter((result) => result.error === null)).toHaveLength(1);
    expect(claims.filter((result) => result.error !== null)).toHaveLength(1);
  });

  it("atomically completes checked-in multi-helper work and keeps first-job state correct", async () => {
    const host = identities.find((identity) => identity.role === "host");
    const wrongHost = identities.find((identity) => identity.role === "wrong-host");
    const helper = identities.find((identity) => identity.role === "helper9");
    const secondHelper = identities.find((identity) => identity.role === "helper8");
    const unassignedHelper = identities.find((identity) => identity.role === "helper5");
    const admin = identities.find((identity) => identity.role === "admin");
    expect(host && wrongHost && helper && secondHelper && unassignedHelper && admin).toBeTruthy();

    const { data: booking, error: bookingError } = await service.from("phase_a_bookings").insert({
      host_id: host!.id,
      address_line: "12 Completion Test Street",
      suburb: "Rosebank",
      city: "Johannesburg",
      services: ["home"],
      helpers_needed: 2,
      start_at: new Date(Date.now() + 2 * 86_400_000).toISOString(),
      end_at_est: new Date(Date.now() + 2 * 86_400_000 + 60 * 60_000).toISOString(),
      pay_per_helper_cents: 10000,
      transport_per_helper_cents: 1000,
      idempotency_key: crypto.randomUUID(),
      status: "in_progress",
    }).select("id").single();
    expect(bookingError).toBeNull();
    completionBookingId = booking!.id;

    const { error: assignmentError } = await service.from("booking_assignments").insert([
      { booking_id: completionBookingId, helper_id: helper!.id, slot: 1, status: "accepted", checked_in_at: new Date().toISOString() },
      { booking_id: completionBookingId, helper_id: secondHelper!.id, slot: 2, status: "accepted", checked_in_at: new Date().toISOString() },
    ]);
    expect(assignmentError).toBeNull();

    const { error: softDeleteError } = await service.from("profiles")
      .update({ deleted_at: new Date().toISOString() }).eq("id", helper!.id);
    expect(softDeleteError).toBeNull();
    let deletedActorError: { code: string } | null = null;
    try {
      const deletedActor = await service.rpc("confirm_phase_a_booking", {
        p_actor_id: helper!.id,
        p_actor_role: "helper",
        p_booking_id: completionBookingId,
      });
      deletedActorError = deletedActor.error;
    } finally {
      const { error: restoreProfileError } = await service.from("profiles")
        .update({ deleted_at: null }).eq("id", helper!.id);
      expect(restoreProfileError).toBeNull();
    }
    expect(deletedActorError).not.toBeNull();

    const wrongOwner = await service.rpc("confirm_phase_a_booking", {
      p_actor_id: wrongHost!.id,
      p_actor_role: "host",
      p_booking_id: completionBookingId,
    });
    const wrongRole = await service.rpc("confirm_phase_a_booking", {
      p_actor_id: admin!.id,
      p_actor_role: "admin",
      p_booking_id: completionBookingId,
    });
    const unassigned = await service.rpc("confirm_phase_a_booking", {
      p_actor_id: unassignedHelper!.id,
      p_actor_role: "helper",
      p_booking_id: completionBookingId,
    });
    expect(wrongOwner.error).not.toBeNull();
    expect(wrongRole.error).not.toBeNull();
    expect(unassigned.error).not.toBeNull();

    const { error: closeBookingError } = await service.from("phase_a_bookings").update({ status: "assigned" }).eq("id", completionBookingId);
    expect(closeBookingError).toBeNull();
    const premature = await service.rpc("confirm_phase_a_booking", {
      p_actor_id: host!.id,
      p_actor_role: "host",
      p_booking_id: completionBookingId,
    });
    expect(premature.error).not.toBeNull();
    const { data: unchangedAssignment } = await service.from("booking_assignments")
      .select("host_confirmed_at, helper_confirmed_at").eq("booking_id", completionBookingId).order("slot").limit(1).single();
    expect(unchangedAssignment).toMatchObject({ host_confirmed_at: null, helper_confirmed_at: null });
    const { error: reopenBookingError } = await service.from("phase_a_bookings").update({ status: "in_progress" }).eq("id", completionBookingId);
    expect(reopenBookingError).toBeNull();

    const helperConfirmation = await service.rpc("confirm_phase_a_booking", {
      p_actor_id: helper!.id,
      p_actor_role: "helper",
      p_booking_id: completionBookingId,
    });
    expect(helperConfirmation.error).toBeNull();
    expect(helperConfirmation.data).toBe(true);

    const [{ data: stillInProgress }, { data: partialAssignments }] = await Promise.all([
      service.from("phase_a_bookings").select("status, completed_at").eq("id", completionBookingId).single(),
      service.from("booking_assignments").select("status, host_confirmed_at, helper_confirmed_at").eq("booking_id", completionBookingId).order("slot"),
    ]);
    expect(stillInProgress).toMatchObject({ status: "in_progress", completed_at: null });
    expect(partialAssignments).toHaveLength(2);
    expect(partialAssignments?.every((row) => row.status === "accepted" && !row.host_confirmed_at)).toBe(true);
    expect(partialAssignments?.[0]?.helper_confirmed_at).toBeTruthy();
    expect(partialAssignments?.[1]?.helper_confirmed_at).toBeNull();

    const { error: removeSecondCheckInError } = await service.from("booking_assignments")
      .update({ checked_in_at: null }).eq("booking_id", completionBookingId).eq("helper_id", secondHelper!.id);
    expect(removeSecondCheckInError).toBeNull();
    const hostBeforeAllArrivals = await service.rpc("confirm_phase_a_booking", {
      p_actor_id: host!.id,
      p_actor_role: "host",
      p_booking_id: completionBookingId,
    });
    expect(hostBeforeAllArrivals.error).not.toBeNull();
    const { data: unconfirmedHostAssignments } = await service.from("booking_assignments")
      .select("host_confirmed_at").eq("booking_id", completionBookingId);
    expect(unconfirmedHostAssignments?.every((row) => row.host_confirmed_at === null)).toBe(true);
    const { error: restoreSecondCheckInError } = await service.from("booking_assignments")
      .update({ checked_in_at: new Date().toISOString() }).eq("booking_id", completionBookingId).eq("helper_id", secondHelper!.id);
    expect(restoreSecondCheckInError).toBeNull();

    const finalConfirmations = await Promise.all([
      service.rpc("confirm_phase_a_booking", { p_actor_id: host!.id, p_actor_role: "host", p_booking_id: completionBookingId }),
      service.rpc("confirm_phase_a_booking", { p_actor_id: secondHelper!.id, p_actor_role: "helper", p_booking_id: completionBookingId }),
    ]);
    expect(finalConfirmations.map((result) => result.error)).toEqual([null, null]);
    expect(finalConfirmations.map((result) => result.data)).toEqual([true, true]);

    const [{ data: completedBooking, error: completedBookingError }, { data: completedAssignments, error: completedAssignmentError }, { data: completedHelpers, error: completedHelperError }] = await Promise.all([
      service.from("phase_a_bookings").select("status, completed_at").eq("id", completionBookingId).single(),
      service.from("booking_assignments").select("helper_id, status, host_confirmed_at, helper_confirmed_at").eq("booking_id", completionBookingId).order("slot"),
      service.from("helper_details").select("user_id, first_job_completed_at").in("user_id", [helper!.id, secondHelper!.id]),
    ]);
    expect(completedBookingError).toBeNull();
    expect(completedAssignmentError).toBeNull();
    expect(completedHelperError).toBeNull();
    expect(completedBooking).toMatchObject({ status: "completed" });
    expect(completedBooking?.completed_at).toBeTruthy();
    expect(completedAssignments).toHaveLength(2);
    expect(completedAssignments?.every((row) => row.status === "completed" && row.host_confirmed_at)).toBe(true);
    expect(completedAssignments?.[0]?.helper_confirmed_at).toBeTruthy();
    expect(completedAssignments?.[1]?.helper_confirmed_at).toBeTruthy();
    expect(completedHelpers).toHaveLength(2);
    expect(completedHelpers?.every((row) => row.first_job_completed_at)).toBe(true);

    const retries = await Promise.all([
      service.rpc("confirm_phase_a_booking", { p_actor_id: host!.id, p_actor_role: "host", p_booking_id: completionBookingId }),
      service.rpc("confirm_phase_a_booking", { p_actor_id: secondHelper!.id, p_actor_role: "helper", p_booking_id: completionBookingId }),
    ]);
    expect(retries.map((result) => result.error)).toEqual([null, null]);
    expect(retries.map((result) => result.data)).toEqual([true, true]);
  });

  it("lets host confirmation complete an in-progress job after check-in without waiting for helper confirmation", async () => {
    const host = identities.find((identity) => identity.role === "host");
    const helper = identities.find((identity) => identity.role === "helper5");
    expect(host && helper).toBeTruthy();

    const { data: booking, error: bookingError } = await service.from("phase_a_bookings").insert({
      host_id: host!.id,
      address_line: "13 Host Confirmation Test Street",
      suburb: "Rosebank",
      city: "Johannesburg",
      services: ["home"],
      helpers_needed: 1,
      start_at: new Date(Date.now() + 4 * 86_400_000).toISOString(),
      end_at_est: new Date(Date.now() + 4 * 86_400_000 + 60 * 60_000).toISOString(),
      pay_per_helper_cents: 10000,
      transport_per_helper_cents: 1000,
      idempotency_key: crypto.randomUUID(),
      status: "in_progress",
    }).select("id").single();
    expect(bookingError).toBeNull();
    hostOnlyCompletionBookingId = booking!.id;
    const { error: assignmentError } = await service.from("booking_assignments").insert({
      booking_id: hostOnlyCompletionBookingId,
      helper_id: helper!.id,
      slot: 1,
      status: "accepted",
      checked_in_at: new Date().toISOString(),
    });
    expect(assignmentError).toBeNull();

    const hostConfirmation = await service.rpc("confirm_phase_a_booking", {
      p_actor_id: host!.id,
      p_actor_role: "host",
      p_booking_id: hostOnlyCompletionBookingId,
    });
    expect(hostConfirmation.error).toBeNull();
    expect(hostConfirmation.data).toBe(true);

    const [{ data: completedBooking }, { data: completedAssignment }, { data: completedHelper }] = await Promise.all([
      service.from("phase_a_bookings").select("status").eq("id", hostOnlyCompletionBookingId).single(),
      service.from("booking_assignments").select("status, helper_confirmed_at").eq("booking_id", hostOnlyCompletionBookingId).single(),
      service.from("helper_details").select("first_job_completed_at").eq("user_id", helper!.id).single(),
    ]);
    expect(completedBooking?.status).toBe("completed");
    expect(completedAssignment).toMatchObject({ status: "completed", helper_confirmed_at: null });
    expect(completedHelper?.first_job_completed_at).toBeTruthy();
  });

  it("auto-completes only expired checked-in bookings without open reports and is safe to retry concurrently", async () => {
    const host = identities.find((identity) => identity.role === "host");
    const helper9 = identities.find((identity) => identity.role === "helper9");
    const helper2 = identities.find((identity) => identity.role === "helper2");
    const helper3 = identities.find((identity) => identity.role === "helper3");
    const helper4 = identities.find((identity) => identity.role === "helper4");
    const helper5 = identities.find((identity) => identity.role === "helper5");
    const helper6 = identities.find((identity) => identity.role === "helper6");
    const helper7 = identities.find((identity) => identity.role === "helper7");
    const helper8 = identities.find((identity) => identity.role === "helper8");
    expect(host && helper9 && helper2 && helper3 && helper4 && helper5 && helper6 && helper7 && helper8).toBeTruthy();

    const now = new Date();
    const fractionalConfig = await service.from("app_config").update({ value: 24.5 }).eq("key", "auto_release_hours");
    expect(fractionalConfig.error?.code).toBe("23514");
    const { data: preservedConfig, error: preservedConfigError } = await service.from("app_config").select("value").eq("key", "auto_release_hours").single();
    expect(preservedConfigError).toBeNull();
    expect(preservedConfig?.value).toBe(24);
    const expiredEnd = new Date(now.getTime() - 25 * 60 * 60_000);
    const due = await createAutoReleaseFixture(host!.id, [helper9!.id], expiredEnd);
    const reportOpen = await createAutoReleaseFixture(host!.id, [helper5!.id], expiredEnd);
    const reportReviewing = await createAutoReleaseFixture(host!.id, [helper6!.id], expiredEnd);
    const missingCheckIn = await createAutoReleaseFixture(host!.id, [helper2!.id, helper3!.id], expiredEnd, [helper3!.id]);
    const hostAlreadyConfirmed = await createAutoReleaseFixture(host!.id, [helper4!.id], expiredEnd, [], true);
    const notYetDue = await createAutoReleaseFixture(host!.id, [helper7!.id], new Date(now.getTime() - 23 * 60 * 60_000));
    const withoutAssignedHelper = await createAutoReleaseFixture(host!.id, [helper8!.id], expiredEnd);
    const missingAssignedHelper = await createAutoReleaseFixture(host!.id, [helper2!.id, helper3!.id], expiredEnd);
    const missingAssignment = await service.from("booking_assignments").delete().eq("booking_id", missingAssignedHelper).eq("helper_id", helper3!.id);
    if (missingAssignment.error) throw new Error("Could not prepare the local incomplete-assignment auto-release case.");
    const helper8Assignment = await service.from("booking_assignments").delete().eq("booking_id", withoutAssignedHelper);
    if (helper8Assignment.error) throw new Error("Could not prepare the local no-assignment auto-release case.");
    const openReportIdentity = identities.find((identity) => identity.role === "host");
    const { error: openReportError } = await service.from("phase_a_reports").insert({
      booking_id: reportOpen,
      reporter_id: openReportIdentity!.id,
      category: "other",
      text: "Synthetic open report for local auto-release test",
      status: "open",
    });
    const { error: reviewingReportError } = await service.from("phase_a_reports").insert({
      booking_id: reportReviewing,
      reporter_id: openReportIdentity!.id,
      category: "other",
      text: "Synthetic reviewing report for local auto-release test",
      status: "reviewing",
    });
    if (openReportError || reviewingReportError) throw new Error("Could not seed local auto-release report fixtures.");

    const helperClient = roleClients.get("helper9");
    expect(helperClient).toBeDefined();
    const deniedRelease = await helperClient!.rpc("auto_release_phase_a_bookings", { p_now: now.toISOString() });
    expect(deniedRelease.error).toBeTruthy();

    const calls = await Promise.all([
      service.rpc("auto_release_phase_a_bookings", { p_now: now.toISOString() }),
      service.rpc("auto_release_phase_a_bookings", { p_now: now.toISOString() }),
    ]);
    expect(calls.every((call) => call.error === null)).toBe(true);
    expect(calls.reduce((count, call) => count + Number(call.data), 0)).toBe(1);

    const { data: completed, error: completedError } = await service.from("phase_a_bookings").select("status, completed_at").eq("id", due).single();
    const { data: completedAssignment, error: completedAssignmentError } = await service.from("booking_assignments").select("status, host_confirmed_at, helper_confirmed_at").eq("booking_id", due).single();
    const { data: firstJob, error: firstJobError } = await service.from("helper_details").select("first_job_completed_at").eq("user_id", helper9!.id).single();
    expect(completedError).toBeNull();
    expect(completedAssignmentError).toBeNull();
    expect(firstJobError).toBeNull();
    expect(completed).toMatchObject({ status: "completed" });
    expect(completed?.completed_at).toBeTruthy();
    expect(completedAssignment).toMatchObject({ status: "completed", host_confirmed_at: null, helper_confirmed_at: null });
    expect(firstJob?.first_job_completed_at).toBeTruthy();

    for (const id of [reportOpen, reportReviewing, missingCheckIn, hostAlreadyConfirmed, notYetDue, withoutAssignedHelper, missingAssignedHelper]) {
      const { data: booking, error } = await service.from("phase_a_bookings").select("status, completed_at").eq("id", id).single();
      expect(error).toBeNull();
      expect(booking).toMatchObject({ status: "in_progress", completed_at: null });
    }

    const retry = await service.rpc("auto_release_phase_a_bookings", { p_now: now.toISOString() });
    expect(retry.error).toBeNull();
    expect(retry.data).toBe(0);
  });
});
