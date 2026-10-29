import { describe, expect, it } from "vitest";
import { AdminAssignmentInputSchema, AdminBookingStatusInputSchema } from "@/server/domain/admin-assignment";

describe("admin assignment input", () => {
  const valid = {
    bookingId: "123e4567-e89b-42d3-a456-426614174000",
    selection: { version: "a".repeat(64), indexes: [0, 2] },
  };

  it("accepts a bounded shortlist version and distinct indexes", () => {
    expect(AdminAssignmentInputSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    { ...valid, extra: true },
    { ...valid, bookingId: "not-a-uuid" },
    { ...valid, selection: { version: "stale", indexes: [0] } },
    { ...valid, selection: { version: "a".repeat(64), indexes: [0, 0] } },
    { ...valid, selection: { version: "a".repeat(64), indexes: [] } },
    { ...valid, selection: { version: "a".repeat(64), indexes: [0, 1, 2, 3, 4] } },
    { ...valid, selection: { version: "a".repeat(64), indexes: [1.5] } },
  ])("rejects malformed, repeated, or excessive selections", (input) => {
    expect(AdminAssignmentInputSchema.safeParse(input).success).toBe(false);
  });
});

describe("admin booking status input", () => {
  it.each(["cancelled", "disputed"] as const)("accepts the allowed target status %s", (status) => {
    expect(AdminBookingStatusInputSchema.safeParse({
      bookingId: "123e4567-e89b-42d3-a456-426614174000",
      status,
    }).success).toBe(true);
  });

  it.each(["open", "assigned", "completed", "unknown", null])("rejects non-admin target state %s", (status) => {
    expect(AdminBookingStatusInputSchema.safeParse({
      bookingId: "123e4567-e89b-42d3-a456-426614174000",
      status,
    }).success).toBe(false);
  });
});
