import { describe, expect, it, vi } from "vitest";
import { HelperYocoSubmissionSchema } from "@/server/domain/yoco-subscription";
import { canAcceptJob, extendSubscriptionByMonths } from "@/server/services/subscription";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  mockRpc: vi.fn(),
}));

vi.mock("@/server/db/server", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    rpc: mocks.mockRpc,
  }),
}));

import { submitHelperYocoPayment } from "@/server/services/yoco-subscription";

describe("HelperYocoSubmissionSchema", () => {
  it("validates a proper Yoco reference", () => {
    const parsed = HelperYocoSubmissionSchema.safeParse({
      reference: "YOCO-PAY-987654",
      periodMonths: 1,
    });
    expect(parsed.success).toBe(true);
  });

  it("defaults periodMonths to 1 when omitted", () => {
    const parsed = HelperYocoSubmissionSchema.safeParse({
      reference: "SIZA-0821234567",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.periodMonths).toBe(1);
    }
  });

  it("rejects too short references", () => {
    const parsed = HelperYocoSubmissionSchema.safeParse({
      reference: "  a ",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("submitHelperYocoPayment service", () => {
  it("submits reference successfully", async () => {
    mocks.mockRpc.mockResolvedValueOnce({
      data: {
        ok: true,
        submission_id: "sub-123",
        status: "pending",
        message: "Your Yoco payment reference has been submitted.",
      },
      error: null,
    });

    const res = await submitHelperYocoPayment({
      reference: "YOCO-PAY-123",
      periodMonths: 1,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.submissionId).toBe("sub-123");
      expect(res.data.status).toBe("pending");
    }
  });

  it("handles duplicate submission error preventing double submissions", async () => {
    mocks.mockRpc.mockResolvedValueOnce({
      data: {
        ok: false,
        error: "duplicate_reference",
        message: "This payment reference has already been submitted and is currently being verified.",
      },
      error: null,
    });

    const res = await submitHelperYocoPayment({
      reference: "YOCO-PAY-123",
      periodMonths: 1,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("conflict");
      expect(res.error.message).toContain("already been submitted");
    }
  });

  it("handles already-cleared payments gracefully", async () => {
    mocks.mockRpc.mockResolvedValueOnce({
      data: {
        ok: true,
        already_cleared: true,
        message: "This payment has already been verified and applied to your account.",
      },
      error: null,
    });

    const res = await submitHelperYocoPayment({
      reference: "YOCO-PAY-CLEARED",
      periodMonths: 1,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.alreadyCleared).toBe(true);
    }
  });
});

describe("Double-charge prevention and non-destructive subscription extension", () => {
  it("allows free 1st job when firstJobCompletedAt is null", () => {
    const now = new Date("2026-11-07T12:00:00Z");
    const allowed = canAcceptJob({
      firstJobCompletedAt: null,
      subscriptionStatus: "none",
      paidUntil: null,
      now,
    });
    expect(allowed).toBe(true);
  });

  it("blocks subsequent jobs if free job completed and subscription is inactive", () => {
    const now = new Date("2026-11-07T12:00:00Z");
    const allowed = canAcceptJob({
      firstJobCompletedAt: "2026-11-06T10:00:00Z",
      subscriptionStatus: "none",
      paidUntil: null,
      now,
    });
    expect(allowed).toBe(false);
  });

  it("extends from existing paidUntil so days are never lost when renewing early", () => {
    const now = new Date("2026-11-07T12:00:00Z");
    // Helper has 15 days remaining on their plan (expires Nov 22)
    const currentPaidUntil = new Date("2026-11-22T12:00:00Z");

    // Renewing adds 1 calendar month starting from current expiry Nov 22 -> Dec 22
    const extended = extendSubscriptionByMonths(currentPaidUntil, now, 1);
    expect(extended.toISOString()).toBe("2026-12-22T12:00:00.000Z");
  });

  it("extends from now() when helper has expired or has no active plan", () => {
    const now = new Date("2026-11-07T12:00:00Z");
    const expiredPaidUntil = new Date("2026-11-01T12:00:00Z");

    const extended = extendSubscriptionByMonths(expiredPaidUntil, now, 1);
    expect(extended.toISOString()).toBe("2026-12-07T12:00:00.000Z");
  });
});
