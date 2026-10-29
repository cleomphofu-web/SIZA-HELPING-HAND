import { describe, expect, it } from "vitest";
import { coversRequiredServices, excludeOverlappingBookingOffers, helperCanSeeOpenOffer, rankEligibleHelpers, selectOffers, selectVisibleOpenSlots, type RotationHelper } from "@/server/services/rotation";

const at = new Date("2026-10-25T08:00:00.000Z");

function helper(id: string, genderMatchGroup: "female" | "male" | null, completedLast30Days = 0, lastAssignedAt: string | null = null, tie = 0): RotationHelper {
  return { id, genderMatchGroup, completedLast30Days, lastAssignedAt, tie, eligible: true };
}

describe("soft gender preference ranking", () => {
  it("uses gender only after fair-workload metrics and never excludes another eligible helper", () => {
    const ranked = rankEligibleHelpers([
      helper("female-more-work", "female", 2, "2026-10-24T08:00:00.000Z"),
      helper("male-less-work", "male", 0, null),
      helper("female-equal-work", "female", 0, null, 2),
    ], "female");

    expect(ranked.map(({ id }) => id)).toEqual(["female-equal-work", "male-less-work", "female-more-work"]);
    expect(ranked).toHaveLength(3);
  });

  it("keeps unmatched and unset helpers eligible when a requested category is unavailable", () => {
    const ranked = rankEligibleHelpers([
      helper("male", "male"),
      helper("unset", null),
    ], "female");

    expect(ranked.map(({ id }) => id)).toEqual(["male", "unset"]);
  });

  it("alternates the soft group preference across slots for a mixed helper request", () => {
    const candidates = [
      helper("f1", "female", 0, null, 1),
      helper("m1", "male", 0, null, 2),
      helper("f2", "female", 0, null, 3),
      helper("m2", "male", 0, null, 4),
      helper("unset", null, 0, null, 5),
    ];

    const offers = selectOffers(candidates, 2, at, 600_000, "mix");
    const firstSlot = offers.filter((offer) => offer.slot === 1).map((offer) => offer.helperId);
    const secondSlot = offers.filter((offer) => offer.slot === 2).map((offer) => offer.helperId);

    expect(firstSlot[0]).toBe("f1");
    expect(secondSlot[0]).toBe("m1");
    expect(new Set(offers.map((offer) => offer.helperId)).size).toBeGreaterThanOrEqual(2);
    expect(offers).toHaveLength(6);
  });

  it("does not use gender when the host has no preference", () => {
    const candidates = [helper("male", "male", 0, null, 1), helper("female", "female", 0, null, 2)];
    expect(rankEligibleHelpers(candidates).map(({ id }) => id)).toEqual(["male", "female"]);
    expect(rankEligibleHelpers(candidates, "any").map(({ id }) => id)).toEqual(["male", "female"]);
  });
});

describe("overlapping accepted helper jobs", () => {
  const jobs = [
    { bookingId: "overlap", startAt: "2026-10-26T08:00:00.000Z", endAt: "2026-10-26T10:00:00.000Z" },
    { bookingId: "adjacent", startAt: "2026-10-26T10:30:00.000Z", endAt: "2026-10-26T11:30:00.000Z" },
  ];
  const accepted = [{ bookingId: "accepted", startAt: "2026-10-26T09:00:00.000Z", endAt: "2026-10-26T10:30:00.000Z" }];

  it("hides only jobs that overlap an accepted time window", () => {
    expect(excludeOverlappingBookingOffers(jobs, accepted).map((job) => job.bookingId)).toEqual(["adjacent"]);
  });

  it("keeps every offered job when the helper has no accepted jobs", () => {
    expect(excludeOverlappingBookingOffers(jobs, [])).toEqual(jobs);
  });
});

describe("helper service coverage", () => {
  it("requires the helper to provide every requested service before showing a job", () => {
    expect(coversRequiredServices(["home", "laundry"], ["home", "laundry", "garden"])).toBe(true);
    expect(coversRequiredServices(["home", "laundry"], ["home"])).toBe(false);
    expect(coversRequiredServices([], ["home"])).toBe(false);
  });
});

describe("no-show slot offers", () => {
  it("keeps an assigned booking in helper offers only while its no-show vacancy is open", () => {
    expect(helperCanSeeOpenOffer("assigned", true)).toBe(true);
    expect(helperCanSeeOpenOffer("assigned", false)).toBe(false);
    expect(helperCanSeeOpenOffer("in_progress", true)).toBe(true);
    expect(helperCanSeeOpenOffer("completed", true)).toBe(false);
  });

  const booking = [{ bookingId: "no-show-booking", helpersNeeded: 1 }];
  const assignments = [{ bookingId: "no-show-booking", helperId: "absent-helper", slot: 1, status: "no_show" as const, noShowAt: at.toISOString() }];
  const reoffer = [
    { bookingId: "no-show-booking", helperId: "old-round-helper", slot: 1, expiresAt: new Date(at.getTime() - 86_400_000).toISOString(), offeredAt: new Date(at.getTime() - 86_400_000).toISOString(), round: 1 },
    { bookingId: "no-show-booking", helperId: "selected-helper", slot: 1, expiresAt: new Date(at.getTime() + 600_000).toISOString(), offeredAt: at.toISOString(), round: 2 },
  ];

  it("shows a reopened slot only to the new rotation recipients until that round expires", () => {
    const beforeExpiry = new Date(at.getTime() + 300_000);
    expect(selectVisibleOpenSlots("selected-helper", booking, assignments, reoffer, beforeExpiry)).toEqual([{ bookingId: "no-show-booking", slot: 1 }]);
    expect(selectVisibleOpenSlots("other-helper", booking, assignments, reoffer, beforeExpiry)).toEqual([]);
  });

  it("shows the reopened slot to all eligible helpers after its new offer round expires", () => {
    const afterExpiry = new Date(at.getTime() + 600_000);
    expect(selectVisibleOpenSlots("other-helper", booking, assignments, reoffer, afterExpiry)).toEqual([{ bookingId: "no-show-booking", slot: 1 }]);
    expect(selectVisibleOpenSlots("absent-helper", booking, assignments, reoffer, afterExpiry)).toEqual([]);
  });

  it("does not show a no-show slot after the host closes that vacancy", () => {
    const resolved = [{ ...assignments[0]!, noShowResolution: "proceed_fewer" }];

    expect(selectVisibleOpenSlots("other-helper", booking, resolved, [], new Date(at.getTime() + 86_400_000))).toEqual([]);
  });
});
