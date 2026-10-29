import "server-only";

import { createSupabaseAdminClient } from "@/server/db/admin";
import { resolveAdminShortlistSelection } from "@/server/views/admin-shortlist";
import { type AdminShortlistSource } from "@/server/views/admin-shortlist";
import { fail, ok, type Result } from "@/server/services/result";
import { excludeOverlappingBookingOffers } from "@/server/services/rotation";

export async function loadAdminShortlistRows(bookingId: string): Promise<Result<AdminShortlistSource[]>> {
  const supabase = createSupabaseAdminClient();
  const { data: booking, error: bookingError } = await supabase
    .from("phase_a_bookings")
    .select("suburb, services, host_id, start_at, end_at_est")
    .eq("id", bookingId)
    .maybeSingle();
  if (bookingError || !booking) return fail("not_found", "That request is no longer available.");

  const { data: host, error: hostError } = await supabase.from("profiles").select("role").eq("id", booking.host_id).maybeSingle();
  if (hostError) return fail("internal_error", "The helper list could not be loaded.");
  if (host?.role !== "host") return fail("not_found", "That request is no longer available.");

  const { data: helpers, error: helperError } = await supabase
    .from("helper_details")
    .select("user_id, rate_note, first_job_completed_at, subscription_status, subscription_paid_until")
    .eq("status", "approved")
    .contains("suburbs", [booking.suburb])
    .overlaps("services", booking.services)
    .order("user_id");
  if (helperError) return fail("internal_error", "The helper list could not be loaded.");

  const eligibleHelpers = (helpers ?? []).filter((helper) =>
    helper.first_job_completed_at === null
    || (helper.subscription_status === "active" && helper.subscription_paid_until !== null && Date.parse(helper.subscription_paid_until) > Date.now()),
  );
  const candidateHelperIds = eligibleHelpers.map((helper) => helper.user_id);
  if (!candidateHelperIds.length) return ok([]);
  const { data: acceptedAssignments, error: assignmentError } = await supabase.from("booking_assignments")
    .select("helper_id, booking_id")
    .in("helper_id", candidateHelperIds)
    .eq("status", "accepted");
  if (assignmentError) return fail("internal_error", "The helper list could not be loaded.");
  const acceptedBookingIds = [...new Set((acceptedAssignments ?? []).map((assignment) => assignment.booking_id))];
  const { data: acceptedBookings, error: acceptedBookingError } = acceptedBookingIds.length
    ? await supabase.from("phase_a_bookings").select("id, start_at, end_at_est").in("id", acceptedBookingIds)
    : { data: [], error: null };
  if (acceptedBookingError) return fail("internal_error", "The helper list could not be loaded.");
  const acceptedBookingById = new Map((acceptedBookings ?? []).map((row) => [row.id, row]));
  const assignmentsByHelper = new Map<string, typeof acceptedAssignments>();
  for (const assignment of acceptedAssignments ?? []) {
    assignmentsByHelper.set(assignment.helper_id, [...(assignmentsByHelper.get(assignment.helper_id) ?? []), assignment]);
  }
  const requestWindow = { bookingId, startAt: booking.start_at, endAt: booking.end_at_est };
  const eligibleWithoutTimeConflict = eligibleHelpers.filter((helper) => {
    const occupiedWindows = (assignmentsByHelper.get(helper.user_id) ?? []).flatMap((assignment) => {
      const occupied = acceptedBookingById.get(assignment.booking_id);
      return occupied ? [{ bookingId: occupied.id, startAt: occupied.start_at, endAt: occupied.end_at_est }] : [];
    });
    return excludeOverlappingBookingOffers([requestWindow], occupiedWindows).length === 1;
  });
  const helperIds = eligibleWithoutTimeConflict.map((helper) => helper.user_id);
  const { data: profiles, error: profileError } = helperIds.length
    ? await supabase.from("profiles").select("id, role, first_name, phone").in("id", helperIds)
    : { data: [], error: null };
  if (profileError) return fail("internal_error", "The helper list could not be loaded.");

  const profilesById = new Map((profiles ?? []).filter((profile) => profile.role === "helper").map((profile) => [profile.id, profile]));
  const rows: AdminShortlistSource[] = eligibleWithoutTimeConflict.flatMap((helper) => {
    const profile = profilesById.get(helper.user_id);
    return profile ? [{ helperId: helper.user_id, rateNote: helper.rate_note, firstName: profile.first_name, phone: profile.phone }] : [];
  });
  return ok(rows);
}

export async function assignAdminShortlistedHelpers(actorId: string, bookingId: string, version: string, indexes: number[]): Promise<Result<{ assignedCount: number }>> {
  const shortlist = await loadAdminShortlistRows(bookingId);
  if (!shortlist.ok) return shortlist;
  const rows = shortlist.data;
  const supabase = createSupabaseAdminClient();

  let selectedHelperIds: string[];
  try {
    selectedHelperIds = resolveAdminShortlistSelection(rows, version, indexes);
  } catch {
    return fail("conflict", "The helper list changed or the selection is no longer valid. Refresh and choose again.");
  }

  const { data, error } = await supabase.rpc("admin_assign_phase_a_helpers", {
    p_actor_id: actorId,
    p_booking_id: bookingId,
    p_helper_ids: selectedHelperIds,
  });
  if (error || typeof data !== "number") {
    return fail("conflict", "One or more helpers are no longer eligible, or the request has changed.");
  }

  return ok({ assignedCount: data });
}

export async function setAdminBookingStatus(actorId: string, bookingId: string, status: "cancelled" | "disputed"): Promise<Result<{ updated: true }>> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("admin_set_phase_a_booking_status", {
    p_actor_id: actorId,
    p_booking_id: bookingId,
    p_next_status: status,
  });
  if (error || data !== true) return fail("conflict", "That request cannot be moved to this status.");
  return ok({ updated: true });
}
