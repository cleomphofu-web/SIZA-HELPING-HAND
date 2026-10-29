import { describe, expect, it } from "vitest";
import { bookingSchema, helperApplicationSchema, helperProfileSchema, normaliseSaPhone } from "@/lib/schemas";

describe("South African phone normalisation", () => {
  it.each(["082 123 4567", "0821234567", "+27821234567"])("normalises %s", (input) => {
    expect(normaliseSaPhone(input)).toBe("+27821234567");
  });
});

describe("booking schema", () => {
  const base = {
    fullName: "Test Host", phone: "0821234567", email: "host@example.com", suburb: "Rosebank", address: "1 Test Street",
    propertyType: "2-bed", helpersNeeded: 1, startAt: new Date(Date.now() + 86_400_000), endAt: new Date(Date.now() + 90_000_000),
    accessNotes: "", notes: "", consent: true, honeypot: "",
  } as const;
  it("accepts a valid future booking", () => expect(bookingSchema.safeParse(base).success).toBe(true));
  it("rejects an end time before the start", () => expect(bookingSchema.safeParse({ ...base, endAt: base.startAt }).success).toBe(false));
  it("rejects unknown fields", () => expect(bookingSchema.safeParse({ ...base, extra: "nope" }).success).toBe(false));
});

describe("helper profile South African ID validation", () => {
  const base = {
    dateOfBirth: new Date("1980-01-01T00:00:00.000Z"),
    jobTitle: "Home helper",
    services: ["home_cleaning"],
    suburbs: ["Johannesburg"],
    idNumber: "8001015009087",
    consent: true,
  };

  it("accepts a 13-digit ID with a valid birth date and official check digit", () => {
    expect(helperProfileSchema.safeParse(base).success).toBe(true);
  });

  it.each([
    ["a short ID", "800101500908"],
    ["an ID with a non-digit", "80010A5009087"],
    ["an impossible birth date with a valid check digit", "8002305009084"],
    ["an incorrect check digit", "8001015009088"],
  ])("rejects %s", (_description, idNumber) => {
    expect(helperProfileSchema.safeParse({ ...base, idNumber }).success).toBe(false);
  });

  it("uses the same ID validation in the helper application schema", () => {
    const application = {
      fullName: "Test Helper",
      phone: "0821234567",
      email: "helper@example.com",
      suburbs: ["Johannesburg"],
      services: ["home"],
      rateAmount: 100,
      rateUnit: "per_hour",
      availability: "Weekdays",
      idNumber: "8001015009088",
      references: [
        { name: "Reference One", phone: "0821234567" },
        { name: "Reference Two", phone: "0821234568" },
      ],
      consent: true,
      honeypot: "",
    };
    expect(helperApplicationSchema.safeParse(application).success).toBe(false);
  });
});
