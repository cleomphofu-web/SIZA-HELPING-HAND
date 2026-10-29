import { describe, expect, it } from "vitest";
import { HelperDecisionSchema, HelperDocumentIdSchema, HelperSuspensionSchema, HelperVettingChecklistSchema } from "@/server/domain/admin-helper";

const helperId = "7f45091d-23b7-4d7c-a3cf-fc70a6e38a26";

describe("admin helper action input", () => {
  it("requires every vetting check to be explicitly true before approval", () => {
    expect(HelperVettingChecklistSchema.safeParse({ idMatchesSelfie: true, idReadable: true, referencesCalled: true }).success).toBe(true);
    expect(HelperVettingChecklistSchema.safeParse({ idMatchesSelfie: true, idReadable: true, referencesCalled: false }).success).toBe(false);
    expect(HelperVettingChecklistSchema.safeParse({ idMatchesSelfie: true, idReadable: true }).success).toBe(false);
    expect(HelperVettingChecklistSchema.safeParse({ idMatchesSelfie: true, idReadable: true, referencesCalled: true, admin: true }).success).toBe(false);
  });

  it("rejects malformed helper and document identifiers", () => {
    expect(HelperDecisionSchema.safeParse({ id: helperId }).success).toBe(true);
    expect(HelperDecisionSchema.safeParse({ id: "not-a-uuid" }).success).toBe(false);
    expect(HelperDocumentIdSchema.safeParse("not-a-uuid").success).toBe(false);
  });

  it("requires a meaningful bounded reason for suspensions", () => {
    expect(HelperSuspensionSchema.safeParse({ id: helperId, reason: " " }).success).toBe(false);
    expect(HelperSuspensionSchema.safeParse({ id: helperId, reason: "Policy review" }).success).toBe(true);
    expect(HelperSuspensionSchema.safeParse({ id: helperId, reason: "x".repeat(1001) }).success).toBe(false);
  });
});
