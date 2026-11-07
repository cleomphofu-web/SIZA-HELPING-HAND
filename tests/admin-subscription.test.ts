import { describe, expect, it } from "vitest";
import { RecordSubscriptionPaymentSchema } from "@/server/domain/admin-subscription";

describe("RecordSubscriptionPaymentSchema", () => {
  it("accepts valid subscription payment inputs with R120 fee", () => {
    const input = {
      helperId: "123e4567-e89b-12d3-a456-426614174000",
      amountCents: 12000,
      periodMonths: 1,
      reference: "YOCO-TEST-REF-01",
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

import { vi } from "vitest";
import { recordClearedHelperSubscription } from "@/server/services/admin-subscription";

vi.mock("server-only", () => ({}));
const mockRpc = vi.fn();
vi.mock("@/server/db/admin", () => ({
  createSupabaseAdminClient: () => ({ rpc: mockRpc }),
}));

describe("recordClearedHelperSubscription service", () => {
  it("records payment successfully and returns updated paidUntil", async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        payment_id: "pay-123",
        subscription_status: "active",
        paid_until: "2026-12-07T00:00:00Z",
      },
      error: null,
    });

    const res = await recordClearedHelperSubscription("admin-1", {
      helperId: "123e4567-e89b-12d3-a456-426614174000",
      amountCents: 12000,
      periodMonths: 1,
      reference: "YOCO-TEST-REF-01",
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.subscriptionStatus).toBe("active");
      expect(res.data.paymentId).toBe("pay-123");
    }
  });

  it("handles duplicate reference as conflict error to prevent double credit", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "duplicate_reference", code: "23505" },
    });

    const res = await recordClearedHelperSubscription("admin-1", {
      helperId: "123e4567-e89b-12d3-a456-426614174000",
      amountCents: 12000,
      periodMonths: 1,
      reference: "YOCO-TEST-REF-01",
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("conflict");
      expect(res.error.message).toContain("already been recorded");
    }
  });
});

