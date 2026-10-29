import { describe, expect, it } from "vitest";
import { helperCanReceiveOffer, type HelperOfferEligibilityProfile } from "@/server/services/rotation";

const now = new Date("2026-10-26T12:00:00.000Z");
const helper: HelperOfferEligibilityProfile = {
  status: "approved",
  services: ["home", "laundry"],
  suburbs: ["Rosebank"],
  firstJobCompletedAt: null,
  subscriptionStatus: "none",
  subscriptionPaidUntil: null,
};
const booking = {
  bookingId: "booking-current",
  suburb: "Rosebank",
  services: ["home"],
  startAt: "2026-10-27T09:00:00.000Z",
  endAt: "2026-10-27T12:00:00.000Z",
};

describe("current helper offer eligibility", () => {
  it("allows an approved helper whose service, suburb and first-job rules still match", () => {
    expect(helperCanReceiveOffer(helper, booking, now, [], new Set())).toBe(true);
  });

  it("hides offers after approval is withdrawn", () => {
    expect(helperCanReceiveOffer({ ...helper, status: "suspended" }, booking, now, [], new Set())).toBe(false);
  });

  it("hides offers when a previously completed helper subscription lapses", () => {
    expect(helperCanReceiveOffer({
      ...helper,
      firstJobCompletedAt: "2026-01-01T00:00:00.000Z",
      subscriptionStatus: "active",
      subscriptionPaidUntil: "2026-10-26T11:59:59.999Z",
    }, booking, now, [], new Set())).toBe(false);
  });

  it("keeps an active prepaid helper eligible until the configured paid-until instant", () => {
    expect(helperCanReceiveOffer({
      ...helper,
      firstJobCompletedAt: "2026-01-01T00:00:00.000Z",
      subscriptionStatus: "active",
      subscriptionPaidUntil: "2026-10-26T12:00:00.001Z",
    }, booking, now, [], new Set())).toBe(true);
  });

  it("hides an offer when the helper no longer serves its suburb or all requested services", () => {
    expect(helperCanReceiveOffer({ ...helper, suburbs: ["Sandton"] }, booking, now, [], new Set())).toBe(false);
    expect(helperCanReceiveOffer({ ...helper, services: ["garden"] }, booking, now, [], new Set())).toBe(false);
  });

  it("hides an offer when the helper already has a record for this booking", () => {
    expect(helperCanReceiveOffer(helper, booking, now, [], new Set([booking.bookingId]))).toBe(false);
  });

  it("hides an offer when another accepted job overlaps its time", () => {
    expect(helperCanReceiveOffer(helper, booking, now, [{
      bookingId: "booking-other",
      startAt: "2026-10-27T11:00:00.000Z",
      endAt: "2026-10-27T13:00:00.000Z",
    }], new Set())).toBe(false);
  });
});
