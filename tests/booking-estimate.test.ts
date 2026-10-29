import { describe, expect, it } from "vitest";
import { phaseABookingSchema } from "@/lib/schemas";
import { estimateBooking, resolveBookingAmounts, type BookingRateCard } from "@/lib/booking-estimate";
import { parseZarToCents } from "@/lib/money";

const rateCards: BookingRateCard[] = [
  {
    service: "standard_clean",
    hourlyCents: "3600",
    perBedroomMinutes: 30,
    perBathroomMinutes: 25,
    sizeBandMinutes: { small: 15, medium: 45, large: 90 },
    addonMinutes: { oven: 25, windows: 20 },
  },
  {
    service: "laundry",
    hourlyCents: "2400",
    perBedroomMinutes: 0,
    perBathroomMinutes: 0,
    sizeBandMinutes: { small: 0, medium: 0, large: 0 },
    addonMinutes: {},
  },
];

const validInput = {
  primaryService: "standard_clean",
  services: ["standard_clean", "laundry"],
  bedrooms: 2,
  bathrooms: 1,
  sizeBand: "medium" as const,
  addons: ["oven"],
};

describe("server-owned booking estimate inputs", () => {
  it("estimates duration from the primary service and applies all selected rates for that full time", () => {
    expect(estimateBooking(validInput, rateCards)).toEqual({
      estimatedMinutes: 155,
      recommendedPayCents: BigInt(15500),
    });
  });

  it("rejects duplicate services instead of charging one rate twice", () => {
    expect(() => estimateBooking({ ...validInput, services: ["standard_clean", "standard_clean"] }, rateCards)).toThrow();
  });

  it("requires the primary service to be selected and configured", () => {
    expect(() => estimateBooking({ ...validInput, primaryService: "deep_clean" }, rateCards)).toThrow();
    expect(() => estimateBooking({ ...validInput, services: ["laundry"] }, rateCards)).toThrow();
  });

  it("rejects add-ons or size bands that have no configured duration", () => {
    expect(() => estimateBooking({ ...validInput, addons: ["unknown"] }, rateCards)).toThrow();
    expect(() => estimateBooking({ ...validInput, sizeBand: "extra_large" as never }, rateCards)).toThrow();
  });
});

describe("host request amount floors", () => {
  it("uses the recommendation and area transport when no higher amount is entered", () => {
    expect(resolveBookingAmounts({
      recommendedPayCents: BigInt(15500),
      floorPercent: 100,
      requestedPayCents: null,
      suggestedTransportCents: BigInt(5000),
      requestedTransportCents: null,
    })).toEqual({ payCents: BigInt(15500), transportCents: BigInt(5000), minimumPayCents: BigInt(15500) });
  });

  it("allows the host to raise pay and transport but rejects values below configured floors", () => {
    expect(resolveBookingAmounts({
      recommendedPayCents: BigInt(15500),
      floorPercent: 100,
      requestedPayCents: BigInt(18000),
      suggestedTransportCents: BigInt(5000),
      requestedTransportCents: BigInt(6000),
    })).toEqual({ payCents: BigInt(18000), transportCents: BigInt(6000), minimumPayCents: BigInt(15500) });
    expect(() => resolveBookingAmounts({ recommendedPayCents: BigInt(15500), floorPercent: 100, requestedPayCents: BigInt(15499), suggestedTransportCents: BigInt(5000), requestedTransportCents: null })).toThrow();
    expect(() => resolveBookingAmounts({ recommendedPayCents: BigInt(15500), floorPercent: 100, requestedPayCents: null, suggestedTransportCents: BigInt(5000), requestedTransportCents: BigInt(4999) })).toThrow();
  });

  it("rounds a configured percentage floor up to the next cent", () => {
    expect(resolveBookingAmounts({ recommendedPayCents: BigInt(101), floorPercent: 80, requestedPayCents: BigInt(81), suggestedTransportCents: BigInt(0), requestedTransportCents: null })).toEqual({ payCents: BigInt(81), transportCents: BigInt(0), minimumPayCents: BigInt(81) });
    expect(() => resolveBookingAmounts({ recommendedPayCents: BigInt(101), floorPercent: 80, requestedPayCents: BigInt(80), suggestedTransportCents: BigInt(0), requestedTransportCents: null })).toThrow();
  });
});

describe("host booking request schema", () => {
  const validRequest = {
    addressLine: "1 Test Street",
    suburb: "Rosebank",
    city: "Johannesburg",
    ...validInput,
    helpersNeeded: 1,
    startAt: new Date(Date.now() + 86_400_000),
    accessNotes: "",
    genderPreference: "any",
    idempotencyKey: "00000000-0000-4000-8000-000000000001",
    outsideAgreementNotice: true,
    addressSharingNotice: true,
    paymentNotice: true,
  };

  it("accepts estimator inputs without a client duration or end time", () => {
    expect(phaseABookingSchema.safeParse(validRequest).success).toBe(true);
  });

  it("rejects client-supplied duration, end time, price, or transport amounts", () => {
    for (const untrusted of [
      { estimatedMinutes: 60 },
      { endAt: new Date(Date.now() + 90_000_000) },
      { payPerHelperCents: "1" },
      { transportPerHelperCents: "1" },
    ]) {
      expect(phaseABookingSchema.safeParse({ ...validRequest, ...untrusted }).success).toBe(false);
    }
  });

  it("interprets a local date-time as South African time instead of server time", () => {
    const parsed = phaseABookingSchema.safeParse({ ...validRequest, startAt: "2030-01-01T10:00" });
    expect(parsed.success && parsed.data.startAt.toISOString()).toBe("2030-01-01T08:00:00.000Z");
  });

  it("parses host-entered rand amounts exactly into integer cents", () => {
    expect(parseZarToCents("125.40")).toBe(BigInt(12540));
    expect(parseZarToCents("8")).toBe(BigInt(800));
    expect(parseZarToCents("")).toBeNull();
    expect(() => parseZarToCents("1.234")).toThrow();
  });
});
