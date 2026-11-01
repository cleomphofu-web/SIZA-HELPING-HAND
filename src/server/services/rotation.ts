export type RotationHelper = {
  id: string;
  completedLast30Days: number;
  lastAssignedAt: string | null;
  tie: number;
  eligible: boolean;
  genderMatchGroup?: "female" | "male" | null;
};

export type HostGenderPreference = "any" | "female" | "male" | "mix";

export type BookingOffer = { bookingId?: string; helperId: string; slot: number; offeredAt: string; expiresAt: string };
export type OpenBookingSlot = { bookingId: string; helpersNeeded: number };
export type BookingTimeWindow = { bookingId: string; startAt: string; endAt: string };
export type AssignmentForVisibility = { bookingId: string; helperId: string; slot: number; status: "accepted" | "cancelled" | "completed" | "no_show"; noShowAt?: string | null; noShowResolution?: string | null };
export type OfferForVisibility = { bookingId: string; helperId: string; slot: number; expiresAt: string; offeredAt?: string; round?: number };

const SERVICE_CANONICAL_MAP: Record<string, string> = {
  home: "home",
  home_cleaning: "home",
  deep_clean: "deep_cleaning",
  deep_cleaning: "deep_cleaning",
  office: "office",
  office_cleaning: "office",
  airbnb_turnover: "airbnb_turnover",
  post_construction: "post_construction",
  move_out: "deep_cleaning",
};

export const SERVICE_ALIASES: Record<string, string[]> = {
  home: ["home", "home_cleaning"],
  home_cleaning: ["home", "home_cleaning"],
  deep_clean: ["deep_clean", "deep_cleaning"],
  deep_cleaning: ["deep_clean", "deep_cleaning"],
  office: ["office", "office_cleaning"],
  office_cleaning: ["office", "office_cleaning"],
  airbnb_turnover: ["airbnb_turnover"],
  post_construction: ["post_construction"],
  move_out: ["move_out", "deep_cleaning", "deep_clean"],
};

export function canonicalService(service: string): string {
  return SERVICE_CANONICAL_MAP[service] ?? service;
}

export function expandServiceAliases(services: readonly string[]): string[] {
  const set = new Set<string>();
  for (const s of services) {
    set.add(s);
    for (const alias of SERVICE_ALIASES[s] ?? []) {
      set.add(alias);
    }
  }
  return [...set];
}

export function coversRequiredServices(requiredServices: readonly string[], helperServices: readonly string[]): boolean {
  if (requiredServices.length === 0) return false;
  const canonicalHelper = new Set(helperServices.map(canonicalService));
  return requiredServices.every((service) =>
    helperServices.includes(service) || canonicalHelper.has(canonicalService(service))
  );
}

export function helperCanSeeOpenOffer(status: "open" | "assigned" | "in_progress" | "completed" | "cancelled" | "disputed" | "expired", hasFreeNoShowSlot: boolean): boolean {
  return status === "open" || (hasFreeNoShowSlot && (status === "assigned" || status === "in_progress"));
}

export function excludeOverlappingBookingOffers<T extends BookingTimeWindow>(
  candidates: T[],
  acceptedBookings: BookingTimeWindow[],
): T[] {
  return candidates.filter((candidate) => {
    const candidateStart = Date.parse(candidate.startAt);
    const candidateEnd = Date.parse(candidate.endAt);
    if (!Number.isFinite(candidateStart) || !Number.isFinite(candidateEnd) || candidateEnd <= candidateStart) return false;
    return !acceptedBookings.some((accepted) => {
      if (accepted.bookingId === candidate.bookingId) return false;
      const acceptedStart = Date.parse(accepted.startAt);
      const acceptedEnd = Date.parse(accepted.endAt);
      if (!Number.isFinite(acceptedStart) || !Number.isFinite(acceptedEnd) || acceptedEnd <= acceptedStart) return true;
      return acceptedStart < candidateEnd && acceptedEnd > candidateStart;
    });
  });
}

export type HelperOfferEligibilityProfile = {
  status: string;
  services: readonly string[];
  suburbs: readonly string[];
  firstJobCompletedAt: string | null;
  subscriptionStatus: string | null;
  subscriptionPaidUntil: string | null;
};

export type HelperOfferBooking = BookingTimeWindow & { suburb: string; services: readonly string[] };

export function helperCanReceiveOffer(
  helper: HelperOfferEligibilityProfile | null,
  booking: HelperOfferBooking,
  now: Date,
  acceptedBookings: BookingTimeWindow[],
  priorBookingIds: ReadonlySet<string>,
): boolean {
  if (!helper || helper.status !== "approved" || helper.services.length === 0 || helper.suburbs.length === 0) return false;
  if (!helper.suburbs.includes(booking.suburb) || !coversRequiredServices(booking.services, helper.services)) return false;
  if (helper.firstJobCompletedAt) {
    const paidUntil = helper.subscriptionPaidUntil ? Date.parse(helper.subscriptionPaidUntil) : Number.NaN;
    if (helper.subscriptionStatus !== "active" || !Number.isFinite(paidUntil) || paidUntil <= now.getTime()) return false;
  }
  if (priorBookingIds.has(booking.bookingId)) return false;
  return excludeOverlappingBookingOffers([booking], acceptedBookings).length === 1;
}

export function selectVisibleOpenSlots(
  helperId: string,
  bookings: OpenBookingSlot[],
  assignments: AssignmentForVisibility[],
  offers: OfferForVisibility[],
  now: Date,
): Array<{ bookingId: string; slot: number }> {
  const priorBookingIds = new Set(assignments.filter((row) => row.helperId === helperId).map((row) => row.bookingId));
  const occupiedSlots = new Set(assignments
    .filter((row) => row.status === "accepted" || row.status === "completed")
    .map((row) => `${row.bookingId}:${row.slot}`));

  return bookings.flatMap((booking) => {
    if (priorBookingIds.has(booking.bookingId)) return [];
    const bookingOffers = offers.filter((offer) => offer.bookingId === booking.bookingId);
    const bookingEarliestExpiry = bookingOffers.reduce<number | null>((earliest, offer) => {
      const expiry = new Date(offer.expiresAt).getTime();
      return earliest === null || expiry < earliest ? expiry : earliest;
    }, null);

    return Array.from({ length: booking.helpersNeeded }, (_, index) => index + 1)
      .filter((slot) => {
        if (occupiedSlots.has(`${booking.bookingId}:${slot}`)) return false;
        const slotNoShows = assignments.filter((row) => row.bookingId === booking.bookingId && row.slot === slot && row.status === "no_show");
        if (slotNoShows.some((row) => row.noShowResolution !== undefined && row.noShowResolution !== null)) return false;
        const latestNoShowAt = slotNoShows.reduce<number | null>((latest, row) => {
          const timestamp = row.noShowAt ? Date.parse(row.noShowAt) : Number.NaN;
          return Number.isFinite(timestamp) && (latest === null || timestamp > latest) ? timestamp : latest;
        }, null);
        const reopenedRoundOffers = latestNoShowAt === null
          ? []
          : bookingOffers.filter((offer) => offer.slot === slot && offer.offeredAt && Date.parse(offer.offeredAt) >= latestNoShowAt);
        const latestReopenedRound = reopenedRoundOffers.reduce<number | null>((latest, offer) =>
          offer.round === undefined ? latest : Math.max(latest ?? offer.round, offer.round), null);
        const currentRoundOffers = latestReopenedRound === null
          ? reopenedRoundOffers
          : reopenedRoundOffers.filter((offer) => offer.round === latestReopenedRound);
        const visibilityOffers = latestNoShowAt === null ? bookingOffers : currentRoundOffers;
        const earliestExpiry = latestNoShowAt === null
          ? bookingEarliestExpiry
          : visibilityOffers.reduce<number | null>((earliest, offer) => {
            const expiry = Date.parse(offer.expiresAt);
            return earliest === null || expiry < earliest ? expiry : earliest;
          }, null);
        const rotationWindowExpired = earliestExpiry === null || now.getTime() >= earliestExpiry;
        const activelyOfferedToHelper = visibilityOffers.some((offer) =>
          offer.helperId === helperId && offer.slot === slot && new Date(offer.expiresAt).getTime() > now.getTime());
        return activelyOfferedToHelper || rotationWindowExpired;
      })
      .map((slot) => ({ bookingId: booking.bookingId, slot }));
  });
}

function preferredGenderForSlot(preference: HostGenderPreference, slot: number): "female" | "male" | null {
  if (preference === "female" || preference === "male") return preference;
  if (preference === "mix") return slot % 2 === 1 ? "female" : "male";
  return null;
}

export function rankEligibleHelpers(helpers: RotationHelper[], preference: HostGenderPreference = "any", slot = 1): RotationHelper[] {
  const preferredGender = preferredGenderForSlot(preference, slot);
  return helpers.filter((helper) => helper.eligible).toSorted((left, right) => {
    const completed = left.completedLast30Days - right.completedLast30Days;
    if (completed !== 0) return completed;
    if (left.lastAssignedAt === null && right.lastAssignedAt !== null) return -1;
    if (left.lastAssignedAt !== null && right.lastAssignedAt === null) return 1;
    if (left.lastAssignedAt !== right.lastAssignedAt) return (left.lastAssignedAt ?? "") < (right.lastAssignedAt ?? "") ? -1 : 1;
    if (preferredGender) {
      const leftPreference = left.genderMatchGroup === preferredGender ? 0 : 1;
      const rightPreference = right.genderMatchGroup === preferredGender ? 0 : 1;
      if (leftPreference !== rightPreference) return leftPreference - rightPreference;
    }
    return left.tie - right.tie;
  });
}

export function selectOffers(helpers: RotationHelper[], helpersNeeded: number, now: Date, offerWindowMs: number, preference: HostGenderPreference = "any"): BookingOffer[] {
  const offeredAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + offerWindowMs).toISOString();
  return Array.from({ length: helpersNeeded }, (_, index) => {
    const slot = index + 1;
    return rankEligibleHelpers(helpers, preference, slot).slice(0, 3).map((helper) => ({
      helperId: helper.id, slot, offeredAt, expiresAt,
    }));
  }).flat();
}
