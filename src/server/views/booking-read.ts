import "server-only";

import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { fail, ok, type Result } from "@/server/services/result";
import {
  viewBookingForAdmin,
  viewBookingForHelper,
  viewBookingForHost,
  type BookingReadActor,
  type BookingReadRecord,
  type BookingView,
} from "@/server/views/booking";
import { expandServiceAliases, helperCanReceiveOffer, helperCanSeeOpenOffer, selectVisibleOpenSlots, type BookingTimeWindow, type HelperOfferEligibilityProfile } from "@/server/services/rotation";
import { getDatabaseNow } from "@/server/views/database-time";

const bookingIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RawBooking = {
  id: string;
  host_id?: string;
  suburb: string;
  city?: string;
  address_line?: string;
  access_notes?: string;
  services?: string[];
  helpers_needed?: number;
  start_at?: string;
  end_at_est?: string;
  status: BookingReadRecord["status"];
  pay_per_helper_cents: number | string;
  transport_per_helper_cents: number | string;
};

type RawAssignment = {
  helper_id: string;
  slot: number;
  status: "accepted" | "cancelled" | "completed" | "no_show";
  checked_in_at: string | null;
  no_show_at?: string | null;
  no_show_resolution?: string | null;
};

export type HostBookingSummary = { id: string; suburb: string; startAt: string; status: BookingReadRecord["status"]; helpersNeeded: number };
export type HelperOfferSummary = { id: string; suburb: string; payPerHelperCents: number | string; transportPerHelperCents: number | string; slot: number };
export type AdminBookingSummary = { id: string; suburb: string; services: string[]; startAt: string; status: BookingReadRecord["status"]; helpersNeeded: number };

function mapBooking(raw: RawBooking, host: { first_name: string; phone: string }, assignments: BookingReadRecord["assignments"], noShowSlots: BookingReadRecord["noShowSlots"] = [], noShowRecoveryMinutes: number | null = null): BookingReadRecord {
  return {
    id: raw.id,
    hostId: raw.host_id ?? "",
    suburb: raw.suburb,
    city: raw.city ?? "",
    address: raw.address_line ?? "",
    accessNotes: raw.access_notes ?? "",
    hostFirstName: host.first_name,
    hostPhone: host.phone,
    payPerHelperCents: raw.pay_per_helper_cents,
    transportPerHelperCents: raw.transport_per_helper_cents,
    services: raw.services ?? [],
    helpersNeeded: raw.helpers_needed ?? 0,
    startAt: raw.start_at ?? "",
    endAt: raw.end_at_est ?? "",
    status: raw.status,
    assignments,
    noShowSlots,
    noShowRecoveryMinutes,
  };
}

async function loadAssignments(bookingId: string, client: ReturnType<typeof createSupabaseAdminClient>) {
  const { data, error } = await client
    .from("booking_assignments")
    .select("helper_id, slot, status, checked_in_at, no_show_at, no_show_resolution")
    .eq("booking_id", bookingId);
  if (error) return { error: true as const };

  const noShowSlots: BookingReadRecord["noShowSlots"] = (data ?? []).filter((assignment: RawAssignment) => assignment.status === "no_show").map((assignment: RawAssignment) => ({
    slot: assignment.slot,
    noShowAt: assignment.no_show_at ?? null,
    resolution: assignment.no_show_resolution === "proceed_fewer" || assignment.no_show_resolution === "close_vacant_slot" ? assignment.no_show_resolution : null,
    canResolve: false,
    canProceedWithFewer: false,
  }));
  const accepted = (data ?? []).filter((assignment: RawAssignment) => assignment.status === "accepted" || assignment.status === "completed");
  if (accepted.length === 0) return { assignments: [], noShowSlots };

  const helperIds = accepted.map((assignment: RawAssignment) => assignment.helper_id);
  const { data: profiles, error: profileError } = await client.from("profiles").select("id, first_name, phone").in("id", helperIds);
  if (profileError || !profiles) return { error: true as const };

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  return {
    noShowSlots,
    assignments: accepted.flatMap((assignment: RawAssignment) => {
      const profile = profileById.get(assignment.helper_id);
      return profile ? [{
        helperId: assignment.helper_id,
        firstName: profile.first_name,
        phone: profile.phone,
        status: assignment.status,
        checkedInAt: assignment.checked_in_at,
      }] : [];
    }),
  };
}

type HelperOfferContext = {
  profile: HelperOfferEligibilityProfile;
  acceptedBookings: BookingTimeWindow[];
};

async function getHelperOfferContext(
  client: ReturnType<typeof createSupabaseAdminClient>,
  helperId: string,
): Promise<{ context: HelperOfferContext | null; error: boolean }> {
  const { data: helper, error: helperError } = await client.from("helper_details")
    .select("status, services, suburbs, first_job_completed_at, subscription_status, subscription_paid_until")
    .eq("user_id", helperId).maybeSingle();
  if (helperError) return { context: null, error: true };
  if (!helper) return { context: null, error: false };
  const { data: profile, error: profileError } = await client.from("profiles")
    .select("role, deleted_at").eq("id", helperId).maybeSingle();
  if (profileError) return { context: null, error: true };
  if (!profile || profile.role !== "helper" || profile.deleted_at !== null) return { context: null, error: false };

  const { data: assignments, error: assignmentError } = await client.from("booking_assignments")
    .select("booking_id").eq("helper_id", helperId).eq("status", "accepted");
  if (assignmentError) return { context: null, error: true };
  const acceptedBookingIds = [...new Set((assignments ?? []).map((assignment) => assignment.booking_id))];
  const { data: acceptedBookings, error: bookingError } = acceptedBookingIds.length
    ? await client.from("phase_a_bookings").select("id, start_at, end_at_est").in("id", acceptedBookingIds)
    : { data: [], error: null };
  if (bookingError) return { context: null, error: true };

  return {
    context: {
      profile: {
        status: helper.status,
        services: helper.services,
        suburbs: helper.suburbs,
        firstJobCompletedAt: helper.first_job_completed_at,
        subscriptionStatus: helper.subscription_status,
        subscriptionPaidUntil: helper.subscription_paid_until,
      },
      acceptedBookings: (acceptedBookings ?? []).map((booking) => ({
        bookingId: booking.id,
        startAt: booking.start_at,
        endAt: booking.end_at_est,
      })),
    },
    error: false,
  };
}

export async function getBookingView(bookingId: string): Promise<Result<BookingView>> {
  if (!bookingIdPattern.test(bookingId)) return fail("not_found", "We could not find that booking.");

  let actor: BookingReadActor;
  try {
    const authenticated = await requireActor();
    actor = { userId: authenticated.userId, role: authenticated.role };
  } catch {
    return fail("unauthenticated", "Please sign in to continue.");
  }

  try {
    const client = createSupabaseAdminClient();
    let raw: RawBooking | null = null;
    let access: "offered" | "assigned" | "history" | "none" = "none";
    let adminMember = false;
    let actorAssignment: RawAssignment | null = null;
    let offerAccessNow: Date | null = null;

    if (actor.role === "host") {
      const { data, error } = await client.from("phase_a_bookings")
        .select("id, host_id, suburb, city, address_line, access_notes, services, helpers_needed, start_at, end_at_est, status, pay_per_helper_cents, transport_per_helper_cents")
        .eq("id", bookingId).eq("host_id", actor.userId).maybeSingle();
      if (error || !data) return fail("not_found", "We could not find that booking.");
      raw = data as RawBooking;
    } else if (actor.role === "helper") {
      const assignmentResult = await client.from("booking_assignments").select("helper_id, status, checked_in_at").eq("booking_id", bookingId).eq("helper_id", actor.userId).in("status", ["accepted", "completed"]).maybeSingle();
      if (assignmentResult.error) return fail("internal_error", "We could not load this booking.");
      const { data: assignment } = assignmentResult;
      if (!assignment) {
        const databaseNow = await getDatabaseNow(client);
        if (!databaseNow) return fail("internal_error", "We could not load this booking.");
        offerAccessNow = databaseNow;
      }
      if (assignment) {
        access = assignment.status === "completed" ? "history" : "assigned";
        actorAssignment = assignment as RawAssignment;
      }
      else access = "offered";

      const bookingQuery = access === "offered"
        ? client.from("phase_a_bookings")
            .select("id, suburb, services, helpers_needed, start_at, end_at_est, status, pay_per_helper_cents, transport_per_helper_cents")
            .eq("id", bookingId)
        : access === "history"
          ? client.from("phase_a_bookings")
            .select("id, suburb, services, start_at, end_at_est, status, pay_per_helper_cents, transport_per_helper_cents")
            .eq("id", bookingId)
        : client.from("phase_a_bookings")
            .select("id, host_id, suburb, city, address_line, services, helpers_needed, start_at, end_at_est, status, pay_per_helper_cents, transport_per_helper_cents")
            .eq("id", bookingId);
      const { data, error } = await bookingQuery.maybeSingle();
      if (error || !data) return fail("not_found", "We could not find that booking.");
      raw = data as RawBooking;
      if (access === "offered") {
        const helperContext = await getHelperOfferContext(client, actor.userId);
        if (helperContext.error) return fail("internal_error", "We could not load this booking.");
        if (!helperContext.context || !offerAccessNow || !helperCanReceiveOffer(
          helperContext.context.profile,
          {
            bookingId,
            suburb: raw.suburb,
            services: raw.services ?? [],
            startAt: raw.start_at ?? "",
            endAt: raw.end_at_est ?? "",
          },
          offerAccessNow,
          helperContext.context.acceptedBookings,
          new Set(),
        )) return fail("not_found", "We could not find that booking.");
        const [assignmentResult, offerResult] = await Promise.all([
          client.from("booking_assignments").select("booking_id, helper_id, slot, status, no_show_at, no_show_resolution").eq("booking_id", bookingId),
          client.from("booking_offers").select("booking_id, helper_id, slot, expires_at, offered_at, offer_round").eq("booking_id", bookingId),
        ]);
        if (assignmentResult.error || offerResult.error) return fail("internal_error", "We could not load this booking.");
        const assignments = (assignmentResult.data ?? []).map((row) => ({
          bookingId: row.booking_id,
          helperId: row.helper_id,
          slot: row.slot,
          status: row.status,
          noShowAt: row.no_show_at,
          noShowResolution: row.no_show_resolution,
        }));
        const offers = (offerResult.data ?? []).map((row) => ({
          bookingId: row.booking_id,
          helperId: row.helper_id,
          slot: row.slot,
          expiresAt: row.expires_at,
          offeredAt: row.offered_at,
          round: row.offer_round,
        }));
        const occupiedSlots = new Set(assignments
          .filter((row) => row.status === "accepted" || row.status === "completed")
          .map((row) => `${row.bookingId}:${row.slot}`));
        const hasFreeNoShowSlot = assignments.some((row) => row.status === "no_show"
          && !row.noShowResolution && !occupiedSlots.has(`${row.bookingId}:${row.slot}`));
        const canSeeBookingState = helperCanSeeOpenOffer(raw.status, hasFreeNoShowSlot);
        const visibleSlots = canSeeBookingState ? selectVisibleOpenSlots(
          actor.userId,
          [{ bookingId, helpersNeeded: raw.helpers_needed ?? 0 }],
          assignments,
          offers,
          offerAccessNow,
        ) : [];
        if (!visibleSlots.length) return fail("not_found", "We could not find that booking.");
      }
    } else {
      const { data: admin } = await client.from("admins").select("user_id").eq("user_id", actor.userId).maybeSingle();
      if (!admin) return fail("not_found", "We could not find that booking.");
      adminMember = true;
      const { data, error } = await client.from("phase_a_bookings")
        .select("id, suburb, city, address_line, access_notes, services, helpers_needed, start_at, end_at_est, status, pay_per_helper_cents, transport_per_helper_cents")
        .eq("id", bookingId).maybeSingle();
      if (error || !data) return fail("not_found", "We could not find that booking.");
      raw = data as RawBooking;
    }

    const needsHostContact = actor.role === "helper" && access === "assigned";
    const hostResult = needsHostContact
      ? await client.from("profiles").select("first_name, phone").eq("id", raw.host_id).maybeSingle()
      : { data: { first_name: "", phone: "" }, error: null };
    if (hostResult.error || !hostResult.data) return fail("internal_error", "We could not load this booking.");

    let assignments: BookingReadRecord["assignments"];
    if (actor.role === "helper") {
      assignments = actorAssignment ? [{
        helperId: actorAssignment.helper_id,
        firstName: "",
        phone: "",
        status: actorAssignment.status,
        checkedInAt: actorAssignment.checked_in_at,
      }] : [];
    } else if (actor.role === "host") {
      const assignmentResult = await loadAssignments(bookingId, client);
      if ("error" in assignmentResult) return fail("internal_error", "We could not load this booking.");
      assignments = assignmentResult.assignments;
      const recoveryResult = assignmentResult.noShowSlots.length
        ? await client.rpc("get_phase_a_host_no_show_slots", { p_host_id: actor.userId, p_booking_id: bookingId })
        : { data: [], error: null };
      if (recoveryResult.error) return fail("internal_error", "We could not load this booking.");
      const recoveryRows = (recoveryResult.data ?? []) as Array<{ slot: number; no_show_at: string | null; resolution: string | null; recovery_minutes: number; can_resolve: boolean; can_proceed_with_fewer: boolean }>;
      const recoveryMinutes = recoveryRows.length ? Number(recoveryRows[0]?.recovery_minutes) : null;
      if (recoveryRows.some((row) => !Number.isInteger(Number(row.recovery_minutes)) || Number(row.recovery_minutes) < 1)) return fail("internal_error", "We could not load this booking.");
      const noShowSlots: BookingReadRecord["noShowSlots"] = recoveryRows.map((row) => ({
        slot: row.slot,
        noShowAt: row.no_show_at,
        resolution: row.resolution === "proceed_fewer" || row.resolution === "close_vacant_slot" ? row.resolution : null,
        canResolve: row.can_resolve === true,
        canProceedWithFewer: row.can_proceed_with_fewer === true,
      }));
      const record = mapBooking(raw, hostResult.data, assignments, noShowSlots, recoveryMinutes);
      const view = viewBookingForHost(record, actor);
      return view ? ok(view) : fail("not_found", "We could not find that booking.");
    } else {
      assignments = [];
    }

    const record = mapBooking(raw, hostResult.data, assignments);
    const view = actor.role === "helper"
      ? viewBookingForHelper(record, actor, access)
      : viewBookingForAdmin(record, actor, adminMember);

    return view ? ok(view) : fail("not_found", "We could not find that booking.");
  } catch {
    return fail("internal_error", "We could not load this booking.");
  }
}

async function authenticatedActor(): Promise<BookingReadActor | null> {
  try {
    const actor = await requireActor();
    return { userId: actor.userId, role: actor.role };
  } catch {
    return null;
  }
}

export async function getHostBookingSummaries(): Promise<Result<HostBookingSummary[]>> {
  const actor = await authenticatedActor();
  if (!actor) return fail("unauthenticated", "Please sign in to continue.");
  if (actor.role !== "host") return fail("not_found", "We could not find these bookings.");
  const { data, error } = await createSupabaseAdminClient().from("phase_a_bookings")
    .select("id, suburb, start_at, status, helpers_needed")
    .eq("host_id", actor.userId).order("start_at", { ascending: false });
  if (error) return fail("internal_error", "We could not load your bookings.");
  return ok((data ?? []).map((booking) => ({ id: booking.id, suburb: booking.suburb, startAt: booking.start_at, status: booking.status, helpersNeeded: booking.helpers_needed })));
}

export async function getHelperOfferSummaries(): Promise<Result<HelperOfferSummary[]>> {
  const actor = await authenticatedActor();
  if (!actor) return fail("unauthenticated", "Please sign in to continue.");
  if (actor.role !== "helper") return fail("not_found", "We could not find these offers.");
  try {
    const client = createSupabaseAdminClient();
    const now = await getDatabaseNow(client);
    if (!now) return fail("internal_error", "We could not load available jobs.");
    const eligibility = await getHelperOfferContext(client, actor.userId);
    if (eligibility.error) return fail("internal_error", "We could not load available jobs.");
    if (!eligibility.context) return ok([]);
    const { profile, acceptedBookings } = eligibility.context;
    if (profile.status !== "approved" || !profile.services.length || !profile.suburbs.length) return ok([]);

    const expandedServices = expandServiceAliases(profile.services);
    const { data: bookingRows, error: bookingError } = await client.from("phase_a_bookings")
      .select("id, status, suburb, services, helpers_needed, pay_per_helper_cents, transport_per_helper_cents, start_at, end_at_est")
      .in("status", ["open", "assigned", "in_progress"]).overlaps("services", expandedServices).in("suburb", profile.suburbs);
    if (bookingError) return fail("internal_error", "We could not load available jobs.");
    const bookings = (bookingRows ?? []).filter((booking) => helperCanReceiveOffer(profile, {
      bookingId: booking.id,
      suburb: booking.suburb,
      services: booking.services,
      startAt: booking.start_at,
      endAt: booking.end_at_est,
    }, now, acceptedBookings, new Set()));
    if (!bookings.length) return ok([]);

    const bookingIds = bookings.map((booking) => booking.id);
    const [assignmentResult, offerResult] = await Promise.all([
      client.from("booking_assignments").select("booking_id, helper_id, slot, status, no_show_at, no_show_resolution").in("booking_id", bookingIds),
      client.from("booking_offers").select("booking_id, helper_id, slot, expires_at, offered_at, offer_round").in("booking_id", bookingIds),
    ]);
    if (assignmentResult.error || offerResult.error) return fail("internal_error", "We could not load available jobs.");

    const assignments = (assignmentResult.data ?? []).map((assignment) => ({ bookingId: assignment.booking_id, helperId: assignment.helper_id, slot: assignment.slot, status: assignment.status, noShowAt: assignment.no_show_at, noShowResolution: assignment.no_show_resolution }));
    const occupiedSlots = new Set(assignments
      .filter((assignment) => assignment.status === "accepted" || assignment.status === "completed")
      .map((assignment) => `${assignment.bookingId}:${assignment.slot}`));
    const bookingsWithReopenedNoShowSlots = new Set(assignments
      .filter((assignment) => assignment.status === "no_show" && !assignment.noShowResolution && !occupiedSlots.has(`${assignment.bookingId}:${assignment.slot}`))
      .map((assignment) => assignment.bookingId));
    const visibleBookings = bookings.filter((booking) => helperCanSeeOpenOffer(booking.status, bookingsWithReopenedNoShowSlots.has(booking.id)));
    if (!visibleBookings.length) return ok([]);

    const visible = selectVisibleOpenSlots(actor.userId,
      visibleBookings.map((booking) => ({ bookingId: booking.id, helpersNeeded: booking.helpers_needed })),
      assignments,
      (offerResult.data ?? []).map((offer) => ({ bookingId: offer.booking_id, helperId: offer.helper_id, slot: offer.slot, expiresAt: offer.expires_at, offeredAt: offer.offered_at, round: offer.offer_round })),
      now,
    );
    const bookingById = new Map(bookings.map((booking) => [booking.id, booking]));
    return ok(visible.flatMap(({ bookingId, slot }) => {
      const booking = bookingById.get(bookingId);
      return booking ? [{ id: booking.id, suburb: booking.suburb, payPerHelperCents: booking.pay_per_helper_cents, transportPerHelperCents: booking.transport_per_helper_cents, slot }] : [];
    }));
  } catch {
    return fail("internal_error", "We could not load available jobs.");
  }
}

export async function getAdminBookingSummaries(): Promise<Result<AdminBookingSummary[]>> {
  const actor = await authenticatedActor();
  if (!actor) return fail("unauthenticated", "Please sign in to continue.");
  if (actor.role !== "admin") return fail("not_found", "We could not find these bookings.");
  const client = createSupabaseAdminClient();
  const { data: membership } = await client.from("admins").select("user_id").eq("user_id", actor.userId).maybeSingle();
  if (!membership) return fail("not_found", "We could not find these bookings.");
  const { data, error } = await client.from("phase_a_bookings")
    .select("id, suburb, services, start_at, status, helpers_needed").order("start_at", { ascending: true });
  if (error) return fail("internal_error", "We could not load bookings.");
  return ok((data ?? []).map((booking) => ({ id: booking.id, suburb: booking.suburb, services: booking.services, startAt: booking.start_at, status: booking.status, helpersNeeded: booking.helpers_needed })));
}
