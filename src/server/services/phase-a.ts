import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import type { checkInCodeRequestSchema, confirmBookingSchema, helperProfileSchema, hostAccountSchema, hostProfileSchema, noShowResolutionSchema, noShowSchema, phaseABookingSchema, reportSchema, repeatIntentSchema, bookAgainSchema } from "@/lib/schemas";
import { fail, ok, type Result } from "@/server/services/result";
import { canAcceptJob } from "@/server/services/subscription";
import { env } from "@/server/config/env";
import { verifyCheckInCode } from "@/server/services/check-in";
import type { checkInSchema } from "@/lib/schemas";
import { encryptIdNumber, hashIdentifier } from "@/server/security/crypto";
import { validateUpload } from "@/server/security/uploads";
import { sanitizeHelperImage } from "@/server/security/image-sanitizer";
import { randomUUID } from "node:crypto";
import { generateCheckInCode, hashCheckInCode } from "@/server/services/check-in";
import { isConfirmationLocked } from "@/server/services/confirmation";
import { estimateBooking, resolveBookingAmounts, type BookingRateCard } from "@/lib/booking-estimate";
import { expandServiceAliases } from "@/server/services/rotation";
import { parseZarToCents } from "@/lib/money";
import { t } from "@/content/t";

type Db = SupabaseClient;
type BookingInput = z.infer<typeof phaseABookingSchema>;
type ReportInput = z.infer<typeof reportSchema>;
type HostProfileInput = z.infer<typeof hostProfileSchema>;
type HostAccountInput = z.infer<typeof hostAccountSchema>;
type HelperProfileInput = z.infer<typeof helperProfileSchema>;
type CheckInInput = z.infer<typeof checkInSchema>;
type CheckInCodeRequest = z.infer<typeof checkInCodeRequestSchema>;
type ConfirmBookingInput = z.infer<typeof confirmBookingSchema>;
type NoShowInput = z.infer<typeof noShowSchema>;
type NoShowResolutionInput = z.infer<typeof noShowResolutionSchema>;
type RepeatIntentInput = z.infer<typeof repeatIntentSchema>;
type BookAgainInput = z.infer<typeof bookAgainSchema>;

function nestedProfileRole(value: unknown): string {
  const profile = Array.isArray(value) ? value[0] : value;
  if (!profile || typeof profile !== "object" || !("role" in profile) || typeof profile.role !== "string") return "";
  return profile.role;
}

async function calculatePay(client: Db, input: BookingInput): Promise<Result<{ pay: string; transport: string; estimatedMinutes: number; estimateInputs: Record<string, unknown> }>> {
  const [{ data: rates, error: rateError }, { data: categories, error: categoryError }, { data: zone, error: zoneError }, { data: floorConfig, error: floorError }, { data: approvedHelpers, error: helpersError }] = await Promise.all([
    client.from("rate_card").select("service, hourly_cents, per_bedroom_minutes, per_bathroom_minutes, size_band_minutes, addon_minutes").in("service", input.services),
    client.from("service_categories").select("name, enabled, pricing").in("name", input.services),
    client.from("transport_zones").select("transport_cents, enabled").eq("suburb", input.suburb).maybeSingle(),
    client.from("app_config").select("value").eq("key", "floor_percent").maybeSingle(),
    client.from("helper_details").select("services, first_job_completed_at, subscription_status, subscription_paid_until, profiles!inner(role)").eq("status", "approved").eq("profiles.role", "helper").contains("suburbs", [input.suburb]),
  ]);
  if (rateError || categoryError || zoneError || floorError || helpersError) return fail("internal_error", "We could not check the service and area settings.");
  if (rates?.length !== input.services.length || categories?.length !== input.services.length || !zone || zone.enabled !== true) {
    return fail("conflict", "That service or area is not open yet.");
  }
  if (!/^\d+$/.test(String(zone.transport_cents))) return fail("internal_error", t("host.book.error.failed"));
  if (categories.some((category) => category.enabled !== true || category.pricing !== "rate_card")) return fail("conflict", "That service is not open for booking yet.");
  const now = Date.now();
  const eligibleHelpers = (approvedHelpers ?? []).filter((helper) =>
    nestedProfileRole(helper.profiles) === "helper"
      && (!helper.first_job_completed_at || (helper.subscription_status === "active" && helper.subscription_paid_until && new Date(helper.subscription_paid_until).getTime() > now)),
  );
  if (eligibleHelpers.filter((helper) => input.services.every((service) => helper.services.includes(service))).length < Math.max(3, input.helpersNeeded)) {
    return fail("conflict", "That service is not open in this area yet.");
  }
  const floorPercent = Number(floorConfig?.value);
  if (!Number.isInteger(floorPercent) || floorPercent < 0 || floorPercent > 100) return fail("internal_error", t("host.book.error.failed"));

  let estimate: ReturnType<typeof estimateBooking>;
  let requestedPay: bigint | null;
  let requestedTransport: bigint | null;
  try {
    const rateCards: BookingRateCard[] = rates.map((rate) => ({
      service: rate.service,
      hourlyCents: rate.hourly_cents,
      perBedroomMinutes: rate.per_bedroom_minutes,
      perBathroomMinutes: rate.per_bathroom_minutes,
      sizeBandMinutes: rate.size_band_minutes,
      addonMinutes: rate.addon_minutes,
    }));
    estimate = estimateBooking(input, rateCards);
    requestedPay = parseZarToCents(input.payPerHelperZar);
    requestedTransport = parseZarToCents(input.transportPerHelperZar);
  } catch {
    return fail("conflict", "The selected service or home details are not fully configured yet.");
  }

  let amounts: ReturnType<typeof resolveBookingAmounts>;
  try {
    amounts = resolveBookingAmounts({
      recommendedPayCents: estimate.recommendedPayCents,
      floorPercent,
      requestedPayCents: requestedPay,
      suggestedTransportCents: BigInt(String(zone.transport_cents)),
      requestedTransportCents: requestedTransport,
    });
  } catch {
    return fail("validation_failed", t("host.book.error.amount_floor"));
  }

  return ok({
    pay: amounts.payCents.toString(),
    transport: amounts.transportCents.toString(),
    estimatedMinutes: estimate.estimatedMinutes,
    estimateInputs: {
      primaryService: input.primaryService,
      services: input.services,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      sizeBand: input.sizeBand,
      addons: input.addons,
    },
  });
}

export async function saveHostDetails(client: Db, hostId: string, input: HostProfileInput): Promise<Result<{ saved: true }>> {
  const { error } = await client.from("host_details").upsert({ user_id: hostId, address_line: input.addressLine, suburb: input.suburb, city: input.city, notes_default: input.notesDefault, updated_at: new Date().toISOString() });
  if (error) return fail("internal_error", "We could not save your profile. Try again in a minute.");
  return ok({ saved: true });
}

export async function saveHostAccountDetails(client: Db, hostId: string, input: HostAccountInput): Promise<Result<{ saved: true }>> {
  try {
    const { data, error } = await client.from("profiles")
      .update({ first_name: input.firstName, last_name: input.lastName, phone: input.phone, updated_at: new Date().toISOString() })
      .eq("id", hostId)
      .eq("role", "host")
      .select("id")
      .maybeSingle();
    if (error) {
      if (error.code === "23505") return fail("conflict", "We could not save these details. Check them and try again.");
      return fail("internal_error", "We could not save your contact details. Try again in a minute.");
    }
    if (!data) return fail("not_found", "We could not find this profile.");
    return ok({ saved: true });
  } catch {
    return fail("internal_error", "We could not save your contact details. Try again in a minute.");
  }
}

export async function saveHelperProfile(client: Db, helperId: string, input: HelperProfileInput, files: { idPhoto: File; selfieCheck: File }): Promise<Result<{ saved: true }>> {
  const checked: Array<{ type: "id_photo" | "selfie_check"; bytes: Buffer; contentType: string; ext: string }> = [];
  for (const [type, file] of [["id_photo", files.idPhoto], ["selfie_check", files.selfieCheck]] as const) {
    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const result = validateUpload({ name: file.name, size: file.size, bytes: fileBytes });
    if (!result.ok) return fail("validation_failed", "One or more documents is invalid.");
    const sanitized = await sanitizeHelperImage(fileBytes);
    if (!sanitized || sanitized.ext !== result.ext) return fail("validation_failed", "One or more documents is invalid.");
    checked.push({ type, bytes: sanitized.bytes, contentType: sanitized.contentType, ext: sanitized.ext });
  }
  const storage = client.storage.from("helper-docs");
  const stagedPaths: string[] = [];
  let applicationRpcStarted = false;
  try {
    const paths: Record<"id_photo" | "selfie_check", string> = { id_photo: "", selfie_check: "" };
    for (const item of checked) {
      const path = `${helperId}/${randomUUID()}.${item.ext}`;
      stagedPaths.push(path);
      const { error: uploadError } = await storage.upload(path, item.bytes, { contentType: item.contentType, upsert: false });
      if (uploadError) throw uploadError;
      paths[item.type] = path;
    }
    applicationRpcStarted = true;
    const rpcResult = await client.rpc("create_helper_application", {
      p_helper_id: helperId,
      p_date_of_birth: input.dateOfBirth.toISOString().slice(0, 10),
      p_job_title: input.jobTitle,
      p_services: expandServiceAliases(input.services),
      p_suburbs: input.suburbs,
      p_bio: input.bio ?? "",
      p_experience_note: input.experienceNote ?? "",
      p_rate_note: input.rateNote ?? "",
      p_id_number_encrypted: encryptIdNumber(input.idNumber),
      p_id_hash: hashIdentifier(input.idNumber),
      p_id_photo_path: paths.id_photo,
      p_selfie_check_path: paths.selfie_check,
      p_reference_name: input.referenceName ?? null,
      p_reference_phone: input.referencePhone ?? null,
    });
    if (rpcResult.error) {
      try {
        await storage.remove(stagedPaths);
      } catch {
        // Do not expose private object paths or storage provider errors.
      }
      if (rpcResult.error.code === "23505") return fail("conflict", "We could not save this profile. Check your details and try again.");
      return fail("internal_error", "We could not save your profile. Try again in a minute.");
    }

    try {
      const { enqueueEmail } = await import("@/server/email/outbox");
      const { env } = await import("@/server/config/env");
      await enqueueEmail(client, {
        eventType: "admin-new-application",
        recipient: env.ADMIN_NOTIFY_EMAIL,
        entityId: helperId,
      });
    } catch {
      // Non-blocking notification
    }
  } catch {
    if (applicationRpcStarted) {
      // A rejected RPC promise has an unknown commit outcome. Deleting staged
      // files here could break a transaction that committed before its response was lost.
      return fail("internal_error", t("helper.apply.error.uncertain"));
    }
    if (stagedPaths.length) {
      try {
        await storage.remove(stagedPaths);
      } catch {
        // Do not expose private object paths or storage provider errors.
      }
    }
    return fail("internal_error", "We could not save your profile. Try again in a minute.");
  }
  return ok({ saved: true });
}

export async function createPhaseABooking(client: Db, hostId: string, input: BookingInput): Promise<Result<{ id: string; payPerHelperCents: string; transportPerHelperCents: string }>> {
  const { data: existing, error: existingError } = await client.from("phase_a_bookings")
    .select("id, pay_per_helper_cents, transport_per_helper_cents")
    .eq("host_id", hostId)
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();
  if (existingError) return fail("internal_error", t("host.book.error.check_existing"));
  if (existing) return ok({ id: existing.id, payPerHelperCents: String(existing.pay_per_helper_cents), transportPerHelperCents: String(existing.transport_per_helper_cents) });

  const { data: graceConfig, error: graceError } = await client.from("app_config").select("value").eq("key", "confirm_grace_hours").maybeSingle();
  if (graceError) return fail("internal_error", t("host.book.error.check_previous"));
  const graceHours = Number(graceConfig?.value);
  if (!Number.isInteger(graceHours) || graceHours < 1) return fail("internal_error", t("host.book.error.check_previous"));
  const { data: previous, error: previousError } = await client.from("phase_a_bookings").select("id, end_at_est").eq("host_id", hostId).in("status", ["assigned", "in_progress", "completed"]).lt("end_at_est", new Date().toISOString()).order("end_at_est", { ascending: false }).limit(20);
  if (previousError) return fail("internal_error", t("host.book.error.check_previous"));
  for (const booking of previous ?? []) {
    const [{ data: assignment, error: assignmentError }, { data: report, error: reportError }] = await Promise.all([
      client.from("booking_assignments").select("host_confirmed_at").eq("booking_id", booking.id).is("host_confirmed_at", null).limit(1).maybeSingle(),
      client.from("phase_a_reports").select("id").eq("booking_id", booking.id).eq("reporter_id", hostId).in("status", ["open", "reviewing", "resolved"]).limit(1).maybeSingle(),
    ]);
    if (assignmentError || reportError) return fail("internal_error", t("host.book.error.check_previous"));
    if (assignment && !report && isConfirmationLocked({ endedAt: new Date(booking.end_at_est), confirmedAt: null, reportedAt: null, now: new Date(), graceHours })) return fail("locked", "Confirm your last job or report a problem before making another request.");
  }
  const calculated = await calculatePay(client, input);
  if (!calculated.ok) return calculated;
  const endAt = new Date(input.startAt.getTime() + calculated.data.estimatedMinutes * 60_000);
  const { data: offerWindow, error: offerWindowError } = await client.from("app_config").select("value").eq("key", "offer_window_minutes").maybeSingle();
  if (offerWindowError) return fail("internal_error", t("host.book.error.prepare_offers"));
  const offerMinutes = Number(offerWindow?.value);
  if (!Number.isInteger(offerMinutes) || offerMinutes < 1) return fail("internal_error", t("host.book.error.prepare_offers"));
  const { data: genderMatchingGate, error: genderMatchingGateError } = await client.from("app_config").select("value").eq("key", "helper_gender_matching_enabled").maybeSingle();
  if (genderMatchingGateError) return fail("internal_error", t("host.book.error.failed"));
  const { data, error } = await client.rpc("create_phase_a_booking_with_offers", {
    p_host_id: hostId,
    p_address_line: input.addressLine,
    p_suburb: input.suburb,
    p_city: input.city,
    p_services: input.services,
    p_helpers_needed: input.helpersNeeded,
    p_start_at: input.startAt.toISOString(),
    p_end_at_est: endAt.toISOString(),
    p_estimated_minutes: calculated.data.estimatedMinutes,
    p_estimate_inputs: calculated.data.estimateInputs,
    p_gender_pref: genderMatchingGate?.value === true ? input.genderPreference : "any",
    p_pay_per_helper_cents: calculated.data.pay,
    p_transport_per_helper_cents: calculated.data.transport,
    p_access_notes: input.accessNotes,
    p_idempotency_key: input.idempotencyKey,
    p_offer_minutes: offerMinutes,
  });
  const booking = Array.isArray(data) ? data[0] : data;
  if (error?.code === "P0001") return fail("conflict", t("host.book.error.not_open"));
  if (error || !booking) return fail("internal_error", t("host.book.error.failed"));

  try {
    const { enqueueEmail } = await import("@/server/email/outbox");
    const { env } = await import("@/server/config/env");
    await enqueueEmail(client, {
      eventType: "admin-new-request",
      recipient: env.ADMIN_NOTIFY_EMAIL,
      entityId: booking.id,
    });
  } catch {
    // Non-blocking outbox insertion: never abort a successfully committed booking transaction
  }

  return ok({ id: booking.id, payPerHelperCents: String(booking.pay_per_helper_cents), transportPerHelperCents: String(booking.transport_per_helper_cents) });
}

export async function issuePhaseACheckInCode(client: Db, hostId: string, input: CheckInCodeRequest): Promise<Result<{ code: string; expiresAt: string }>> {
  const { data: booking, error } = await client.from("phase_a_bookings").select("id, end_at_est, status").eq("id", input.bookingId).eq("host_id", hostId).maybeSingle();
  if (error || !booking || booking.status !== "assigned") return fail("not_found", "This check-in code is not available yet.");
  const { data: config } = await client.from("app_config").select("value").eq("key", "check_in_expiry_hours").maybeSingle();
  const expiryHours = Number(config?.value);
  if (!Number.isInteger(expiryHours) || expiryHours < 1) return fail("internal_error", "We could not issue a check-in code. Try again in a minute.");
  const expiresAt = new Date(new Date(booking.end_at_est).getTime() + expiryHours * 60 * 60 * 1000).toISOString();
  const code = generateCheckInCode();
  const { data: updated, error: updateError } = await client.from("phase_a_bookings")
    .update({ check_in_code_hash: hashCheckInCode(code, env.ID_ENCRYPTION_KEY), check_in_code_expires_at: expiresAt, updated_at: new Date().toISOString() })
    .eq("id", booking.id)
    .eq("host_id", hostId)
    .eq("status", "assigned")
    .select("id")
    .maybeSingle();
  if (updateError) return fail("internal_error", "We could not issue a check-in code. Try again in a minute.");
  if (!updated) return fail("conflict", "This check-in code is no longer available. Refresh the request and try again.");
  return ok({ code, expiresAt });
}

export async function confirmPhaseABooking(client: Db, actorId: string, role: "host" | "helper", input: ConfirmBookingInput): Promise<Result<{ confirmed: true }>> {
  const { data, error } = await client.rpc("confirm_phase_a_booking", {
    p_actor_id: actorId,
    p_actor_role: role,
    p_booking_id: input.bookingId,
  });
  if (error?.code === "P0002") return fail("not_found", "We could not find that booking.");
  if (error?.code === "42501") return fail("forbidden", "Only a booking participant can confirm it.");
  if (error?.code === "P0001") return fail("conflict", "This job is not ready to be confirmed.");
  if (error || data !== true) return fail("internal_error", "We could not record your confirmation. Try again in a minute.");
  return ok({ confirmed: true });
}

export async function handlePhaseANoShow(client: Db, hostId: string, input: NoShowInput): Promise<Result<{ reopened: true }>> {
  const { data, error } = await client.rpc("record_phase_a_helper_no_show_with_assignment_state", {
    p_host_id: hostId,
    p_booking_id: input.bookingId,
    p_helper_id: input.helperId,
  });
  if (error?.code === "P0002") return fail("not_found", "We could not find that booking.");
  if (error?.code === "42501") return fail("forbidden", "Only the host can report a no-show.");
  if (error?.code === "P0001") return fail("conflict", "This helper cannot be marked as a no-show now.");
  if (error || typeof data !== "string") return fail("internal_error", "We could not record the no-show. Try again in a minute.");
  return ok({ reopened: true });
}

export async function resolvePhaseANoShowSlot(client: Db, hostId: string, input: NoShowResolutionInput): Promise<Result<{ closed: true }>> {
  const { data, error } = await client.rpc("resolve_phase_a_no_show_slot", {
    p_host_id: hostId,
    p_booking_id: input.bookingId,
    p_slot: input.slot,
    p_resolution: input.resolution,
  });
  if (error?.code === "P0002") return fail("not_found", "We could not find that booking.");
  if (error?.code === "42501") return fail("forbidden", "Only the host can resolve this vacant slot.");
  if (error?.code === "P0001") return fail("conflict", "This vacant slot cannot be closed now.");
  if (error || typeof data !== "string") return fail("internal_error", "We could not close the vacant slot. Try again in a minute.");
  return ok({ closed: true });
}

export async function acceptPhaseABooking(client: Db, helperId: string, bookingId: string, slot: number): Promise<Result<{ assignmentId: string }>> {
  const { data: helper, error: helperError } = await client.from("helper_details").select("first_job_completed_at, subscription_status, subscription_paid_until, status").eq("user_id", helperId).maybeSingle();
  if (helperError || !helper || helper.status !== "approved") return fail("forbidden", "This job is not available to you.");
  if (!canAcceptJob({ firstJobCompletedAt: helper.first_job_completed_at, subscriptionStatus: helper.subscription_status, paidUntil: helper.subscription_paid_until ? new Date(helper.subscription_paid_until) : null, now: new Date() })) return fail("subscription_required", "A current subscription is needed before you accept later jobs.");
  const { data: graceConfig } = await client.from("app_config").select("value").eq("key", "confirm_grace_hours").maybeSingle();
  const graceHours = Number(graceConfig?.value);
  if (!Number.isInteger(graceHours) || graceHours < 1) return fail("internal_error", "We could not check your previous jobs. Try again in a minute.");
  const { data: previousAssignments } = await client.from("booking_assignments").select("booking_id, helper_confirmed_at").eq("helper_id", helperId).is("helper_confirmed_at", null);
  for (const previous of previousAssignments ?? []) {
    const [{ data: previousBooking }, { data: report }] = await Promise.all([
      client.from("phase_a_bookings").select("end_at_est").eq("id", previous.booking_id).maybeSingle(),
      client.from("phase_a_reports").select("id").eq("booking_id", previous.booking_id).eq("reporter_id", helperId).in("status", ["open", "reviewing", "resolved"]).limit(1).maybeSingle(),
    ]);
    if (previousBooking && !report && isConfirmationLocked({ endedAt: new Date(previousBooking.end_at_est), confirmedAt: null, reportedAt: null, now: new Date(), graceHours })) return fail("locked", "Confirm your last job or report a problem before accepting another.");
  }
  const { data: rawData, error } = await client.rpc("claim_phase_a_slot", { p_booking_id: bookingId, p_helper_id: helperId, p_slot: slot }).single();
  const data = rawData as { id: string } | null;
  if (error || !data) return fail("already_taken", "Another helper accepted this job first.");
  return ok({ assignmentId: data.id });
}

export async function createPhaseAReport(client: Db, reporterId: string, input: ReportInput): Promise<Result<{ id: string }>> {
  const { data, error } = await client.rpc("create_phase_a_report", {
    p_reporter_id: reporterId,
    p_booking_id: input.bookingId,
    p_subject_id: input.subjectId,
    p_category: input.category,
    p_text: input.text,
    p_idempotency_key: input.idempotencyKey,
  });
  if (error?.code === "P0002") return fail("not_found", "We could not find that booking.");
  if (error?.code === "42501") return fail("forbidden", "You cannot send this report.");
  if (error?.code === "22023") return fail("validation_failed", "Check the report details and try again.");
  if (error || typeof data !== "string") return fail("internal_error", "We could not save your report. Try again in a minute.");
  return ok({ id: data });
}

export async function checkInPhaseABooking(client: Db, helperId: string, input: CheckInInput): Promise<Result<{ checkedIn: boolean }>> {
  const { data: assignment, error } = await client.from("booking_assignments").select("id, booking_id, booking:phase_a_bookings(check_in_code_hash, check_in_code_expires_at)").eq("booking_id", input.bookingId).eq("helper_id", helperId).eq("status", "accepted").maybeSingle();
  if (error || !assignment) return fail("not_found", "This check-in is not available.");
  const booking = Array.isArray(assignment.booking) ? assignment.booking[0] : assignment.booking;
  const hash = booking?.check_in_code_hash;
  if (typeof hash !== "string") return fail("conflict", "The host has not received a check-in code yet.");
  const matches = verifyCheckInCode(input.code, hash, env.ID_ENCRYPTION_KEY);
  const now = new Date();
  const { data: rawAttempt, error: attemptError } = await client.rpc("check_in_phase_a_booking", {
    p_booking_id: input.bookingId,
    p_helper_id: helperId,
    p_now: now.toISOString(),
    p_matches: matches,
  }).single();
  const attempt = rawAttempt as { accepted: boolean; attempts: number; locked_until: string | null } | null;
  if (attemptError || !attempt) return fail("internal_error", "We could not record check-in. Try again in a minute.");
  if (!attempt.accepted) {
    const activeLock = attempt.locked_until !== null && Date.parse(attempt.locked_until) > now.getTime();
    return activeLock
      ? fail("locked", "Too many incorrect attempts. Wait before trying again.")
      : fail("conflict", "That code was not accepted. Check the code and try again.");
  }
  return ok({ checkedIn: true });
}

/**
 * Record a host's private "Would you book this helper again?" survey answer.
 * Only the booking's host may submit; the answer is never exposed to helpers.
 */
export async function recordRepeatIntent(
  client: Db,
  hostId: string,
  input: RepeatIntentInput,
): Promise<Result<{ recorded: boolean }>> {
  // Verify the host owns this booking and it is completed
  const { data: booking, error: bookingError } = await client
    .from("phase_a_bookings")
    .select("id, host_id, status")
    .eq("id", input.bookingId)
    .eq("host_id", hostId)
    .eq("status", "completed")
    .maybeSingle();
  if (bookingError || !booking) return fail("not_found", "We could not find that booking.");

  // Verify the helper was actually assigned and completed the job
  const { data: assignment, error: assignmentError } = await client
    .from("booking_assignments")
    .select("id")
    .eq("booking_id", input.bookingId)
    .eq("helper_id", input.helperId)
    .eq("status", "completed")
    .maybeSingle();
  if (assignmentError || !assignment) return fail("not_found", "We could not find that assignment.");

  const { error: updateError } = await client
    .from("booking_assignments")
    .update({ repeat_intent: input.intent === "yes" })
    .eq("id", assignment.id);
  if (updateError) return fail("internal_error", "We could not save your feedback. Try again in a minute.");

  return ok({ recorded: true });
}

/**
 * "Book Again" — creates a new booking pre-filled from a previously completed one,
 * with the chosen helper receiving the first offer window.
 * Only available to hosts with ≥3 completed bookings.
 */
export async function createBookAgainBooking(
  client: Db,
  hostId: string,
  input: BookAgainInput,
): Promise<Result<{ bookingId: string }>> {
  // Gate: host must have ≥3 completed bookings
  const { count, error: countError } = await client
    .from("phase_a_bookings")
    .select("id", { count: "exact", head: true })
    .eq("host_id", hostId)
    .eq("status", "completed");
  if (countError) return fail("internal_error", "We could not check your booking history.");
  if ((count ?? 0) < 3) return fail("forbidden", "The \"Book Again\" feature is available after your 3rd completed booking.");

  // Load the source booking — must belong to this host and be completed
  const { data: source, error: sourceError } = await client
    .from("phase_a_bookings")
    .select("id, suburb, city, address_line, access_notes, services, helpers_needed, pay_per_helper_cents, transport_per_helper_cents")
    .eq("id", input.sourceBookingId)
    .eq("host_id", hostId)
    .eq("status", "completed")
    .maybeSingle();
  if (sourceError || !source) return fail("not_found", "We could not find that booking.");

  // Verify the preferred helper is still approved and covers the suburb
  const { data: helperDetails, error: helperError } = await client
    .from("helper_details")
    .select("status, suburbs, services")
    .eq("user_id", input.helperId)
    .maybeSingle();
  if (helperError || !helperDetails) return fail("not_found", "We could not find that helper.");
  if (helperDetails.status !== "approved") return fail("conflict", "That helper is not currently available.");
  if (!helperDetails.suburbs.includes(source.suburb))
    return fail("conflict", "That helper does not cover this suburb.");

  // Create the new booking — start_at set 7 days from now at 08:00 SAST as a placeholder
  // Host will still need to confirm timing in their dashboard
  const startPlaceholder = new Date();
  startPlaceholder.setUTCDate(startPlaceholder.getUTCDate() + 7);
  startPlaceholder.setUTCHours(6, 0, 0, 0); // 06:00 UTC = 08:00 SAST
  const endPlaceholder = new Date(startPlaceholder.getTime() + 4 * 60 * 60 * 1000); // +4h estimate

  const newBookingId = randomUUID();
  const { error: insertError } = await client.from("phase_a_bookings").insert({
    id: newBookingId,
    host_id: hostId,
    suburb: source.suburb,
    city: source.city,
    address_line: source.address_line,
    access_notes: source.access_notes,
    services: source.services,
    helpers_needed: source.helpers_needed,
    pay_per_helper_cents: source.pay_per_helper_cents,
    transport_per_helper_cents: source.transport_per_helper_cents,
    start_at: startPlaceholder.toISOString(),
    end_at_est: endPlaceholder.toISOString(),
    status: "open",
  });
  if (insertError) return fail("internal_error", "We could not create your booking. Try again in a minute.");

  // Give the preferred helper the first offer slot (offer_round = 0, expires in 30 min)
  const offerExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await client.from("booking_offers").insert({
    booking_id: newBookingId,
    helper_id: input.helperId,
    slot: 1,
    offer_round: 0,
    offered_at: new Date().toISOString(),
    expires_at: offerExpiresAt.toISOString(),
  });
  // (If offer expires or is declined, standard rotation takes over automatically)

  return ok({ bookingId: newBookingId });
}
