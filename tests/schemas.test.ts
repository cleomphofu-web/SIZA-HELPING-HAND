import { describe, expect, it } from "vitest";
import { bookingSchema, normaliseSaPhone } from "@/lib/schemas";

describe("South African phone normalisation", () => {
  it.each(["082 123 4567", "0821234567", "+27821234567"])("normalises %s", (input) => {
    expect(normaliseSaPhone(input)).toBe("+27821234567");
  });
});

describe("booking schema", () => {
  const base = {
    fullName: "Test Host", phone: "0821234567", email: "host@example.com", suburb: "Rosebank", address: "1 Test Street",
    propertyType: "2-bed", cleanersNeeded: 1, startAt: new Date(Date.now() + 86_400_000), endAt: new Date(Date.now() + 90_000_000),
    accessNotes: "", notes: "", consent: true, honeypot: "",
  } as const;
  it("accepts a valid future booking", () => expect(bookingSchema.safeParse(base).success).toBe(true));
  it("rejects an end time before the start", () => expect(bookingSchema.safeParse({ ...base, endAt: base.startAt }).success).toBe(false));
  it("rejects unknown fields", () => expect(bookingSchema.safeParse({ ...base, extra: "nope" }).success).toBe(false));
});
