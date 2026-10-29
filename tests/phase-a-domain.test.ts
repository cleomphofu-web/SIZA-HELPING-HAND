import { describe, expect, it } from "vitest";
import { transitionBooking } from "@/server/services/booking-state";
import { rankEligibleHelpers, selectOffers, selectVisibleOpenSlots } from "@/server/services/rotation";
import { viewBookingForHelper, viewBookingForHost } from "@/server/views/booking";
import { generateCheckInCode, hashCheckInCode, nextCheckInAttempt, verifyCheckInCode } from "@/server/services/check-in";
import { canAcceptJob, extendSubscription, extendSubscriptionByMonths } from "@/server/services/subscription";
import { assertOwner, assertRole } from "@/server/policies/authorization";
import { accountEntrySchema, phaseABookingSchema } from "@/lib/schemas";
import { isConfirmationLocked } from "@/server/services/confirmation";
import { recommendedPayForServices } from "@/lib/money";

describe("Phase A booking state machine", () => {
  it("allows the core flow", () => {
    expect(transitionBooking("open", "assign")).toBe("assigned");
    expect(transitionBooking("assigned", "check_in")).toBe("in_progress");
    expect(transitionBooking("in_progress", "complete")).toBe("completed");
  });

  it("rejects an illegal transition", () => {
    expect(() => transitionBooking("completed", "assign")).toThrow("Invalid booking transition");
  });
});

describe("fair rotation", () => {
  const helpers = [
    { id: "a", completedLast30Days: 3, lastAssignedAt: "2026-10-17T00:00:00.000Z", tie: 0.5, eligible: true },
    { id: "b", completedLast30Days: 0, lastAssignedAt: "2026-10-16T00:00:00.000Z", tie: 0.9, eligible: true },
    { id: "c", completedLast30Days: 0, lastAssignedAt: null, tie: 0.1, eligible: true },
  ];

  it("ranks fewest recent jobs then longest since last job", () => {
    expect(rankEligibleHelpers(helpers).map((helper) => helper.id)).toEqual(["c", "b", "a"]);
  });

  it("offers the top helpers for each slot and sets a window", () => {
    const offers = selectOffers(helpers, 1, new Date("2026-10-18T00:00:00.000Z"), 10 * 60_000);
    expect(offers.map((offer) => offer.helperId)).toEqual(["c", "b", "a"]);
    expect(offers.every((offer) => offer.expiresAt === "2026-10-18T00:10:00.000Z")).toBe(true);
  });

  it("shows only a helper's active offer before the rotation window expires", () => {
    const slots = selectVisibleOpenSlots("helper-a", [{ bookingId: "booking-a", helpersNeeded: 2 }], [], [
      { bookingId: "booking-a", helperId: "helper-a", slot: 1, expiresAt: "2026-10-18T00:10:00.000Z" },
      { bookingId: "booking-a", helperId: "helper-b", slot: 2, expiresAt: "2026-10-18T00:10:00.000Z" },
    ], new Date("2026-10-18T00:05:00.000Z"));
    expect(slots).toEqual([{ bookingId: "booking-a", slot: 1 }]);
  });

  it("shows every free slot to an eligible helper after the earliest offer expires", () => {
    const slots = selectVisibleOpenSlots("helper-c", [{ bookingId: "booking-a", helpersNeeded: 3 }], [
      { bookingId: "booking-a", helperId: "helper-a", slot: 1, status: "accepted" },
    ], [
      { bookingId: "booking-a", helperId: "helper-a", slot: 1, expiresAt: "2026-10-18T00:10:00.000Z" },
      { bookingId: "booking-a", helperId: "helper-b", slot: 2, expiresAt: "2026-10-18T00:10:00.000Z" },
      { bookingId: "booking-a", helperId: "helper-b", slot: 3, expiresAt: "2026-10-18T00:10:00.000Z" },
    ], new Date("2026-10-18T00:10:00.001Z"));
    expect(slots).toEqual([
      { bookingId: "booking-a", slot: 2 },
      { bookingId: "booking-a", slot: 3 },
    ]);
  });

  it("does not expose a later-offered slot until the booking's earliest offer expires", () => {
    const offers = [
      { bookingId: "booking-a", helperId: "helper-a", slot: 1, expiresAt: "2026-10-18T00:10:00.000Z" },
      { bookingId: "booking-a", helperId: "helper-b", slot: 2, expiresAt: "2026-10-18T00:20:00.000Z" },
    ];
    expect(selectVisibleOpenSlots("helper-c", [{ bookingId: "booking-a", helpersNeeded: 2 }], [], offers,
      new Date("2026-10-18T00:09:59.999Z"))).toEqual([]);
    expect(selectVisibleOpenSlots("helper-c", [{ bookingId: "booking-a", helpersNeeded: 2 }], [], offers,
      new Date("2026-10-18T00:10:00.000Z"))).toEqual([
      { bookingId: "booking-a", slot: 1 },
      { bookingId: "booking-a", slot: 2 },
    ]);
  });

  it("shows slots when no offers were created but excludes occupied slots and prior helpers", () => {
    const slots = selectVisibleOpenSlots("helper-a", [
      { bookingId: "booking-a", helpersNeeded: 2 },
      { bookingId: "booking-b", helpersNeeded: 1 },
    ], [
      { bookingId: "booking-a", helperId: "helper-b", slot: 1, status: "accepted" },
      { bookingId: "booking-b", helperId: "helper-a", slot: 1, status: "no_show" },
    ], [], new Date("2026-10-18T00:00:00.000Z"));
    expect(slots).toEqual([{ bookingId: "booking-a", slot: 2 }]);
  });
});

describe("recommended pay arithmetic", () => {
  it("adds each selected service rate for the estimated duration using integer cents", () => {
    expect(recommendedPayForServices([6000, 3000], 90)).toBe(BigInt(13500));
  });

  it("rounds a fractional cent up once after summing rates", () => {
    expect(recommendedPayForServices([1, 1], 30)).toBe(BigInt(1));
  });
});

describe("redacted booking views", () => {
  const booking = {
    id: "booking-1", hostId: "host-1", suburb: "Soweto", city: "Johannesburg", address: "1 Private Street", accessNotes: "", hostFirstName: "Ava", hostPhone: "+27821234567",
    payPerHelperCents: 50000, transportPerHelperCents: 5000,
    services: ["home"], helpersNeeded: 1, startAt: "2026-10-20T08:00:00.000Z", endAt: "2026-10-20T12:00:00.000Z", status: "assigned" as const,
    assignments: [{ helperId: "helper-1", firstName: "Sam", phone: "+27829876543", status: "accepted" as const }],
    noShowSlots: [],
    noShowRecoveryMinutes: null,
  };

  it("does not reveal address or host phone before assignment", () => {
    const view = viewBookingForHelper(booking, { userId: "helper-2", role: "helper" }, "offered");
    expect(view).not.toHaveProperty("address");
    expect(view).not.toHaveProperty("hostPhone");
  });

  it("reveals only assigned details", () => {
    expect(viewBookingForHelper(booking, { userId: "helper-1", role: "helper" }, "assigned")).toMatchObject({ address: booking.address, hostPhone: booking.hostPhone });
    expect(viewBookingForHost(booking, { userId: "host-1", role: "host" })).toMatchObject({ assignedHelpers: [{ phone: "+27829876543" }] });
  });
});

describe("check-in code", () => {
  it("generates a six-digit code and verifies only its HMAC", () => {
    const code = generateCheckInCode(() => 123456);
    const hash = hashCheckInCode(code, "test-pepper");
    expect(code).toBe("123456");
    expect(verifyCheckInCode(code, hash, "test-pepper")).toBe(true);
    expect(verifyCheckInCode("000000", hash, "test-pepper")).toBe(false);
  });

  it("locks after five wrong attempts and accepts a valid attempt before expiry", () => {
    const now = new Date("2026-10-18T00:00:00.000Z");
    let state = { attempts: 0, lockedUntil: null as Date | null, expiresAt: new Date("2026-10-18T12:00:00.000Z") };
    for (let i = 0; i < 5; i += 1) state = nextCheckInAttempt(state, now, false, 5, 15);
    expect(state.lockedUntil?.toISOString()).toBe("2026-10-18T00:15:00.000Z");
    expect(nextCheckInAttempt(state, now, true, 5, 15)).toMatchObject({ accepted: false });
    expect(nextCheckInAttempt({ attempts: 0, lockedUntil: null, expiresAt: new Date("2026-10-18T12:00:00.000Z") }, now, true, 5, 15).accepted).toBe(true);
  });

  it("starts a fresh five-attempt window after the lock expires", () => {
    const expiry = new Date("2026-10-18T12:00:00.000Z");
    const state = { attempts: 5, lockedUntil: new Date("2026-10-18T00:15:00.000Z"), expiresAt: expiry };
    expect(nextCheckInAttempt(state, new Date("2026-10-18T00:16:00.000Z"), false, 5, 15)).toMatchObject({ attempts: 1, lockedUntil: null, accepted: false });
  });
});

describe("subscription gate", () => {
  it("allows the first job and blocks a later lapsed subscription", () => {
    const now = new Date("2026-10-18T00:00:00.000Z");
    expect(canAcceptJob({ firstJobCompletedAt: null, subscriptionStatus: "none", paidUntil: null, now })).toBe(true);
    expect(canAcceptJob({ firstJobCompletedAt: "2026-10-17T00:00:00.000Z", subscriptionStatus: "lapsed", paidUntil: null, now })).toBe(false);
  });

  it("extends from the later of now and the existing paid-until date", () => {
    expect(extendSubscription(new Date("2026-10-20T00:00:00.000Z"), new Date("2026-10-18T00:00:00.000Z"), 30).toISOString()).toBe("2026-11-19T00:00:00.000Z");
  });

  it("extends configured prepaid calendar months from the later of now and the paid-until date", () => {
    expect(extendSubscriptionByMonths(new Date("2026-11-30T10:15:00.000Z"), new Date("2026-10-31T10:15:00.000Z"), 1).toISOString()).toBe("2026-12-30T10:15:00.000Z");
    expect(extendSubscriptionByMonths(null, new Date("2026-01-31T10:15:00.000Z"), 1).toISOString()).toBe("2026-02-28T10:15:00.000Z");
    expect(extendSubscriptionByMonths(null, new Date("2024-01-31T10:15:00.000Z"), 1).toISOString()).toBe("2024-02-29T10:15:00.000Z");
    expect(() => extendSubscriptionByMonths(null, new Date("2026-01-01T00:00:00.000Z"), 2)).toThrow("invalid_subscription_period");
  });
});

describe("authorization", () => {
  it("requires the expected role", () => {
    expect(() => assertRole({ id: "u1", role: "host" }, "helper")).toThrow("forbidden");
    expect(assertRole({ id: "u1", role: "helper" }, "helper").id).toBe("u1");
  });

  it("requires resource ownership unless the caller is an admin", () => {
    expect(() => assertOwner({ id: "u1", role: "host" }, "u2")).toThrow("forbidden");
    expect(assertOwner({ id: "admin", role: "admin" }, "u2").role).toBe("admin");
  });
});

describe("Phase A input schemas", () => {
  it("rejects a booking that omits the required notices", () => {
    const result = phaseABookingSchema.safeParse({
      addressLine: "1 Test Street", suburb: "Rosebank", city: "Johannesburg", services: ["home"], primaryService: "home", bedrooms: 1, bathrooms: 1, sizeBand: "medium", addons: [], helpersNeeded: 1,
      startAt: new Date(Date.now() + 86_400_000), genderPreference: "any", accessNotes: "", idempotencyKey: "00000000-0000-4000-8000-000000000001",
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate services so a rate cannot be charged twice", () => {
    const result = phaseABookingSchema.safeParse({
      addressLine: "1 Test Street", suburb: "Rosebank", city: "Johannesburg", services: ["home", "home"], primaryService: "home", bedrooms: 1, bathrooms: 1, sizeBand: "medium", addons: [], helpersNeeded: 1,
      startAt: new Date(Date.now() + 86_400_000), genderPreference: "any", accessNotes: "", idempotencyKey: "00000000-0000-4000-8000-000000000001",
      outsideAgreementNotice: true, addressSharingNotice: true, paymentNotice: true,
    });
    expect(result.success).toBe(false);
  });

  it("requires both consent records at account entry", () => {
    expect(accountEntrySchema.safeParse({ email: "host@example.com", password: "long-enough-password", role: "host", firstName: "Ava", lastName: "Host", phone: "0821234567", termsVersion: "v1", privacyVersion: "v1", termsAccepted: true, privacyAccepted: false }).success).toBe(false);
  });
});

describe("confirmation lock", () => {
  it("locks only the party who has not confirmed after the grace window", () => {
    const endedAt = new Date("2026-10-18T00:00:00.000Z");
    const now = new Date("2026-10-18T13:00:00.000Z");
    expect(isConfirmationLocked({ endedAt, confirmedAt: null, reportedAt: null, now, graceHours: 12 })).toBe(true);
    expect(isConfirmationLocked({ endedAt, confirmedAt: new Date("2026-10-18T12:30:00.000Z"), reportedAt: null, now, graceHours: 12 })).toBe(false);
  });
});
