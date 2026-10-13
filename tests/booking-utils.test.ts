import { describe, expect, it } from "vitest";
import { buildJobSummary, isUnassignedUrgent, whatsappLink } from "@/lib/booking-utils";

describe("booking utilities", () => {
  it("builds a WhatsApp-safe summary without client contacts", () => {
    const summary = buildJobSummary({ suburb: "Rosebank", start_at: "2030-01-01T10:00:00.000Z", property_type: "2-bed", cleaners_needed: 1, access_notes: "Key safe" });
    expect(summary).toContain("Rosebank");
    expect(summary).not.toContain("@");
    expect(summary).not.toContain("+27");
  });
  it("normalises a WhatsApp link", () => expect(whatsappLink("+27821234567", "Hi")).toBe("https://wa.me/27821234567?text=Hi"));
  it("flags an unassigned booking inside the threshold", () => expect(isUnassignedUrgent({ start_at: "2030-01-01T10:00:00.000Z" }, new Date("2030-01-01T00:00:00.000Z"), 24)).toBe(true));
});
