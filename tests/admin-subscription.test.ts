import { describe, expect, it } from "vitest";
import { RecordSubscriptionPaymentSchema } from "@/server/domain/admin-subscription";

describe("RecordSubscriptionPaymentSchema", () => {
  it("accepts valid subscription payment inputs", () => {
    const input = {
      helperId: "123e4567-e89b-12d3-a456-426614174000",
      amountCents: 15000,
      periodMonths: 1,
      reference: "EFT-TEST-REF-01",
    };
    const parsed = RecordSubscriptionPaymentSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it("accepts 3 and 6 month periods", () => {
    expect(RecordSubscriptionPaymentSchema.safeParse({
      helperId: "123e4567-e89b-12d3-a456-426614174000",
      amountCents: 40000,
      periodMonths: 3,
      reference: "EFT-TEST-REF-03",
    }).success).toBe(true);

    expect(RecordSubscriptionPaymentSchema.safeParse({
      helperId: "123e4567-e89b-12d3-a456-426614174000",
      amountCents: 75000,
      periodMonths: 6,
      reference: "EFT-TEST-REF-06",
    }).success).toBe(true);
  });

  it("rejects invalid period months", () => {
    const input = {
      helperId: "123e4567-e89b-12d3-a456-426614174000",
      amountCents: 15000,
      periodMonths: 2,
      reference: "EFT-TEST-REF-02",
    };
    const parsed = RecordSubscriptionPaymentSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });

  it("rejects negative or zero amounts", () => {
    expect(RecordSubscriptionPaymentSchema.safeParse({
      helperId: "123e4567-e89b-12d3-a456-426614174000",
      amountCents: 0,
      periodMonths: 1,
      reference: "EFT-TEST-REF-01",
    }).success).toBe(false);

    expect(RecordSubscriptionPaymentSchema.safeParse({
      helperId: "123e4567-e89b-12d3-a456-426614174000",
      amountCents: -500,
      periodMonths: 1,
      reference: "EFT-TEST-REF-01",
    }).success).toBe(false);
  });

  it("rejects too short or whitespace reference", () => {
    expect(RecordSubscriptionPaymentSchema.safeParse({
      helperId: "123e4567-e89b-12d3-a456-426614174000",
      amountCents: 15000,
      periodMonths: 1,
      reference: "  ",
    }).success).toBe(false);

    expect(RecordSubscriptionPaymentSchema.safeParse({
      helperId: "123e4567-e89b-12d3-a456-426614174000",
      amountCents: 15000,
      periodMonths: 1,
      reference: "12",
    }).success).toBe(false);
  });
});

