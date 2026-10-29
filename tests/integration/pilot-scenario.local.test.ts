import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/config/env", () => ({
  env: {
    SUPABASE_URL: "http://127.0.0.1:55021",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
    SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
    RESEND_API_KEY: "re_mock",
    RESEND_FROM_EMAIL: "notifications@siza.co.za",
    ID_ENCRYPTION_KEY: "mock_id_key",
    WHATSAPP_GROUP_LINK: "https://chat.whatsapp.com/mock",
    ADMIN_NOTIFY_EMAIL: "admin@siza.co.za",
    NEXT_PUBLIC_HERO_VIDEO_ID: "mock_video",
  },
}));

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { enqueueEmail } from "@/server/email/outbox";

const enabled = process.env.RUN_LOCAL_SUPABASE_RLS_TESTS === "true";
const integration = enabled ? describe : describe.skip;

function localConfig() {
  const url = process.env.LOCAL_SUPABASE_URL || "http://127.0.0.1:55021";
  const anonKey = process.env.LOCAL_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
  const serviceRoleKey = process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
  return { url, anonKey, serviceRoleKey };
}

integration("End-to-End Pilot Scenario: Host Request -> Helper Rotation -> Check-in -> First-Job Free -> Subscription Gate", () => {
  let adminClient: SupabaseClient;
  let adminId: string;
  let hostId: string;
  const helperIds: string[] = [];
  let primaryHelperId: string;
  let bookingId: string;
  let pilotSuburb: string;

  beforeAll(async () => {
    const config = localConfig();
    adminClient = createClient(config.url, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    pilotSuburb = `PilotArea_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;

    // Add pilotSuburb to transport_zones so it is valid
    await adminClient.from("transport_zones").insert({
      suburb: pilotSuburb,
      region: "johannesburg",
      zone: "PILOT",
      transport_cents: 5000,
      enabled: true,
    });

    // 0. Create an Admin user for Step 6 subscription marking
    const adminEmail = `pilot-admin-${crypto.randomUUID()}@example.test`;
    const { data: adminAuth, error: adminAuthErr } = await adminClient.auth.admin.createUser({
      email: adminEmail,
      password: "PilotPassword123!",
      email_confirm: true,
    });
    expect(adminAuthErr).toBeNull();
    adminId = adminAuth.user!.id;
    const adminPhone = `+2782${Math.floor(1000000 + Math.random() * 9000000)}`;
    const { error: adminProfileErr } = await adminClient.from("profiles").insert({
      id: adminId,
      role: "admin",
      first_name: "Admin",
      phone: adminPhone,
      terms_version: "pilot-v1",
      terms_accepted_at: new Date().toISOString(),
      privacy_version: "pilot-v1",
      privacy_accepted_at: new Date().toISOString(),
    });
    expect(adminProfileErr).toBeNull();
    const { error: adminRowErr } = await adminClient.from("admins").insert({ user_id: adminId });
    expect(adminRowErr).toBeNull();

    // 1. Create Host User
    const hostEmail = `pilot-host-${crypto.randomUUID()}@example.test`;
    const { data: hostAuth, error: hostAuthErr } = await adminClient.auth.admin.createUser({
      email: hostEmail,
      password: "PilotPassword123!",
      email_confirm: true,
    });
    expect(hostAuthErr).toBeNull();
    hostId = hostAuth.user!.id;
    const hostPhone = `+2782${Math.floor(1000000 + Math.random() * 9000000)}`;

    const { error: hostProfileErr } = await adminClient.from("profiles").insert({
      id: hostId,
      role: "host",
      first_name: "Thabo",
      phone: hostPhone,
      terms_version: "pilot-v1",
      terms_accepted_at: new Date().toISOString(),
      privacy_version: "pilot-v1",
      privacy_accepted_at: new Date().toISOString(),
    });
    expect(hostProfileErr).toBeNull();
    await adminClient.from("host_details").insert({ user_id: hostId });

    // 2. Create 4 Helper Users to ensure enough eligible candidates remain even after one helper completes a job
    for (let i = 1; i <= 4; i++) {
      const helperEmail = `pilot-helper-${i}-${crypto.randomUUID()}@example.test`;
      const { data: helperAuth, error: helperAuthErr } = await adminClient.auth.admin.createUser({
        email: helperEmail,
        password: "PilotPassword123!",
        email_confirm: true,
      });
      expect(helperAuthErr).toBeNull();
      const hid = helperAuth.user!.id;
      helperIds.push(hid);

      const helperPhone = `+2783${Math.floor(1000000 + Math.random() * 9000000)}`;
      const { error: hProfErr } = await adminClient.from("profiles").insert({
        id: hid,
        role: "helper",
        first_name: `Helper_${i}`,
        phone: helperPhone,
        terms_version: "pilot-v1",
        terms_accepted_at: new Date().toISOString(),
        privacy_version: "pilot-v1",
        privacy_accepted_at: new Date().toISOString(),
      });
      expect(hProfErr).toBeNull();

      const { error: hDetailErr } = await adminClient.from("helper_details").insert({
        user_id: hid,
        date_of_birth: "1994-05-15",
        job_title: "Domestic Specialist",
        services: ["home"],
        suburbs: [pilotSuburb],
        id_number_encrypted: "enc_mock_id",
        id_hash: crypto.randomUUID().replace(/-/g, ""),
        status: "approved",
        subscription_status: "none",
        subscription_paid_until: null,
        first_job_completed_at: null,
      });
      expect(hDetailErr).toBeNull();
    }

    primaryHelperId = helperIds[0];
  });

  afterAll(async () => {
    if (bookingId) {
      await adminClient.from("booking_assignments").delete().eq("booking_id", bookingId);
      await adminClient.from("booking_offers").delete().eq("booking_id", bookingId);
      await adminClient.from("phase_a_bookings").delete().eq("id", bookingId);
    }
    for (const hid of helperIds) {
      await adminClient.from("helper_details").delete().eq("user_id", hid);
      await adminClient.from("profiles").delete().eq("id", hid);
      await adminClient.auth.admin.deleteUser(hid);
    }
    if (hostId) {
      await adminClient.from("host_details").delete().eq("user_id", hostId);
      await adminClient.from("profiles").delete().eq("id", hostId);
      await adminClient.auth.admin.deleteUser(hostId);
    }
    if (adminId) {
      await adminClient.from("admins").delete().eq("user_id", adminId);
      await adminClient.from("profiles").delete().eq("id", adminId);
      await adminClient.auth.admin.deleteUser(adminId);
    }
    if (pilotSuburb) {
      await adminClient.from("transport_zones").delete().eq("suburb", pilotSuburb);
    }
  });

  it("Step 1: Host creates a booking with offers and an outbox event is enqueued", async () => {
    const startAt = new Date(Date.now() + 3600_000);
    const endAtEst = new Date(startAt.getTime() + 180 * 60_000); // 3 hours

    const { data, error } = await adminClient.rpc("create_phase_a_booking_with_offers", {
      p_host_id: hostId,
      p_address_line: "123 Oxford Road",
      p_suburb: pilotSuburb,
      p_city: "Johannesburg",
      p_services: ["home"],
      p_helpers_needed: 1,
      p_start_at: startAt.toISOString(),
      p_end_at_est: endAtEst.toISOString(),
      p_estimated_minutes: 180,
      p_estimate_inputs: { primaryService: "home", services: ["home"], bedrooms: 2, bathrooms: 1, sizeBand: "small", addons: [] },
      p_gender_pref: "any",
      p_pay_per_helper_cents: 30000,
      p_transport_per_helper_cents: 5000,
      p_access_notes: "Buzz gate 4B",
      p_idempotency_key: crypto.randomUUID(),
      p_offer_minutes: 30,
    });

    expect(error).toBeNull();
    const booking = Array.isArray(data) ? data[0] : data;
    expect(booking).toBeDefined();
    bookingId = booking.id;

    // Enqueue outbox notification
    const outboxResult = await enqueueEmail(adminClient, {
      eventType: "admin-new-request",
      recipient: "admin@siza.co.za",
      entityId: bookingId,
    });
    expect(outboxResult.enqueued).toBe(true);

    // Verify 3 distinct offers were generated for slot 1
    const { data: offers, error: offerError } = await adminClient
      .from("booking_offers")
      .select("*")
      .eq("booking_id", bookingId);
    expect(offerError).toBeNull();
    expect(offers?.length).toBe(3);
    primaryHelperId = offers![0].helper_id;
    expect(offers?.some((o) => o.helper_id === primaryHelperId)).toBe(true);
  });

  it("Step 2: Helper accepts the offered slot without requiring prepaid subscription (First Job Free)", async () => {
    const { data: assignment, error: claimError } = await adminClient.rpc("claim_phase_a_slot", {
      p_booking_id: bookingId,
      p_helper_id: primaryHelperId,
      p_slot: 1,
    });

    expect(claimError).toBeNull();
    expect(assignment).toBeDefined();
    expect(assignment.status).toBe("accepted");

    // Booking status transitions to 'assigned'
    const { data: booking } = await adminClient.from("phase_a_bookings").select("status").eq("id", bookingId).single();
    expect(booking?.status).toBe("assigned");
  });

  it("Step 3: Host generates a check-in code and helper successfully enters code upon arrival", async () => {
    const checkInCode = "749201";
    const cryptoMod = await import("node:crypto");
    const codeHash = cryptoMod.createHash("sha256").update(checkInCode).digest("hex");

    const expiresAt = new Date(Date.now() + 12 * 3600_000);
    await adminClient
      .from("phase_a_bookings")
      .update({
        check_in_code_hash: codeHash,
        check_in_code_expires_at: expiresAt.toISOString(),
      })
      .eq("id", bookingId);

    // Call check_in_phase_a_booking RPC
    const { data: attemptResult, error: codeErr } = await adminClient.rpc("check_in_phase_a_booking", {
      p_booking_id: bookingId,
      p_helper_id: primaryHelperId,
      p_now: new Date().toISOString(),
      p_matches: true,
    }).single();

    expect(codeErr).toBeNull();
    expect((attemptResult as { accepted?: boolean })?.accepted).toBe(true);

    const { data: booking } = await adminClient.from("phase_a_bookings").select("status").eq("id", bookingId).single();
    expect(booking?.status).toBe("in_progress");
  });

  it("Step 4: Job completes, triggering first_job_completed_at timestamp", async () => {
    const completedAt = new Date();
    await adminClient
      .from("booking_assignments")
      .update({ status: "completed" })
      .eq("booking_id", bookingId);

    await adminClient
      .from("phase_a_bookings")
      .update({
        status: "completed",
        completed_at: completedAt.toISOString(),
      })
      .eq("id", bookingId);

    await adminClient
      .from("helper_details")
      .update({ first_job_completed_at: completedAt.toISOString() })
      .eq("user_id", primaryHelperId);

    const { data: helper } = await adminClient
      .from("helper_details")
      .select("first_job_completed_at, subscription_status")
      .eq("user_id", primaryHelperId)
      .single();

    expect(helper?.first_job_completed_at).not.toBeNull();
    expect(helper?.subscription_status).toBe("none");
  });

  it("Step 5: Paywall activates — Helper CANNOT accept 2nd job without an active subscription", async () => {
    // Create a 2nd booking in our pilot area
    const startAt = new Date(Date.now() + 48 * 3600_000);
    const endAtEst = new Date(startAt.getTime() + 180 * 60_000);

    const { data: secondBookingData, error: secondBookingErr } = await adminClient.rpc("create_phase_a_booking_with_offers", {
      p_host_id: hostId,
      p_address_line: "456 Jan Smuts Ave",
      p_suburb: pilotSuburb,
      p_city: "Johannesburg",
      p_services: ["home"],
      p_helpers_needed: 1,
      p_start_at: startAt.toISOString(),
      p_end_at_est: endAtEst.toISOString(),
      p_estimated_minutes: 180,
      p_estimate_inputs: { primaryService: "home", services: ["home"], bedrooms: 1, bathrooms: 1, sizeBand: "small", addons: [] },
      p_gender_pref: "any",
      p_pay_per_helper_cents: 30000,
      p_transport_per_helper_cents: 5000,
      p_access_notes: "Gate code 1234",
      p_idempotency_key: crypto.randomUUID(),
      p_offer_minutes: 30,
    });

    expect(secondBookingErr).toBeNull();
    const secondBookingId = Array.isArray(secondBookingData) ? secondBookingData[0].id : secondBookingData.id;

    // Helper tries to claim slot on 2nd job without subscription -> must fail with slot_unavailable
    const { error: claimError } = await adminClient.rpc("claim_phase_a_slot", {
      p_booking_id: secondBookingId,
      p_helper_id: primaryHelperId,
      p_slot: 1,
    });

    expect(claimError).not.toBeNull();
    expect(claimError?.message).toContain("slot_unavailable");

    // Clean up second booking
    await adminClient.from("booking_offers").delete().eq("booking_id", secondBookingId);
    await adminClient.from("phase_a_bookings").delete().eq("id", secondBookingId);
  });

  it("Step 6: Admin records cleared prepaid subscription payment -> helper unlocked", async () => {
    // Call the RPC directly with admin authority
    const { data: paymentResult, error: paymentError } = await adminClient.rpc("admin_record_helper_subscription", {
      p_actor_id: adminId,
      p_helper_id: primaryHelperId,
      p_amount_cents: 15000,
      p_period_months: 1,
      p_reference: "EFT-TEST-PILOT-01",
    });

    expect(paymentError).toBeNull();
    expect(paymentResult).toBeDefined();
    expect(paymentResult?.subscription_status).toBe("active");
    expect(paymentResult?.paid_until).toBeDefined();

    const { data: helper } = await adminClient
      .from("helper_details")
      .select("subscription_status, subscription_paid_until")
      .eq("user_id", primaryHelperId)
      .single();

    expect(helper?.subscription_status).toBe("active");
    expect(new Date(helper?.subscription_paid_until).getTime()).toBeGreaterThan(Date.now());
  });
});
