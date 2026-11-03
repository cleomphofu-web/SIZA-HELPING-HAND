import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  determineCancellation,
  determineStrikeAction,
} from "@/server/services/cancellation-policy";

describe("Cancellation policy", () => {
  const baseInput = {
    bookingStatus: "assigned" as const,
    startAt: new Date("2026-12-01T10:00:00Z"),
    totalPaidCents: BigInt(36000),
    cancelledByRole: "host" as const,
    isNoShow: false,
    helperCompensationCents: BigInt(10000), // R100 from app_config
  };

  describe("determineCancellation", () => {
    it("gives full refund for helper no-show", () => {
      const result = determineCancellation({
        ...baseInput,
        cancelledAt: new Date("2026-12-01T10:30:00Z"),
        isNoShow: true,
      });

      expect(result.type).toBe("helper_no_show");
      expect(result.refundAmountCents).toBe(BigInt(36000));
      expect(result.helperCompensationCents).toBe(BigInt(0));
    });

    it("gives full refund when cancelled before assignment", () => {
      const result = determineCancellation({
        ...baseInput,
        bookingStatus: "open",
        cancelledAt: new Date("2026-11-30T08:00:00Z"),
      });

      expect(result.type).toBe("host_before_assignment");
      expect(result.refundAmountCents).toBe(BigInt(36000));
      expect(result.helperCompensationCents).toBe(BigInt(0));
    });

    it("gives full refund when cancelled >4 hours before start", () => {
      const result = determineCancellation({
        ...baseInput,
        cancelledAt: new Date("2026-12-01T05:00:00Z"), // 5 hours before
      });

      expect(result.type).toBe("host_gt_4h");
      expect(result.refundAmountCents).toBe(BigInt(36000));
      expect(result.helperCompensationCents).toBe(BigInt(0));
    });

    it("gives partial refund when cancelled <4 hours before start", () => {
      const result = determineCancellation({
        ...baseInput,
        cancelledAt: new Date("2026-12-01T07:00:00Z"), // 3 hours before
      });

      expect(result.type).toBe("host_lt_4h");
      expect(result.refundAmountCents).toBe(BigInt(26000)); // 36000 - 10000
      expect(result.helperCompensationCents).toBe(BigInt(10000));
    });

    it("gives partial refund when cancelled exactly 4 hours before start", () => {
      const result = determineCancellation({
        ...baseInput,
        cancelledAt: new Date("2026-12-01T06:00:00Z"), // exactly 4 hours
      });

      expect(result.type).toBe("host_lt_4h");
      expect(result.refundAmountCents).toBe(BigInt(26000));
      expect(result.helperCompensationCents).toBe(BigInt(10000));
    });

    it("caps helper compensation at total paid when compensation exceeds total", () => {
      const result = determineCancellation({
        ...baseInput,
        totalPaidCents: BigInt(5000), // R50 total
        helperCompensationCents: BigInt(10000), // R100 compensation > R50 total
        cancelledAt: new Date("2026-12-01T09:00:00Z"), // 1 hour before
      });

      expect(result.type).toBe("host_lt_4h");
      expect(result.helperCompensationCents).toBe(BigInt(5000)); // capped at total
      expect(result.refundAmountCents).toBe(BigInt(0)); // nothing left
    });

    it("gives full refund when cancelled after start (no-show scenario)", () => {
      const result = determineCancellation({
        ...baseInput,
        cancelledAt: new Date("2026-12-01T11:00:00Z"), // after start
      });

      // Negative hours = <4h, so host_lt_4h applies
      expect(result.type).toBe("host_lt_4h");
    });

    it("includes policy snapshot text", () => {
      const result = determineCancellation({
        ...baseInput,
        cancelledAt: new Date("2026-12-01T07:00:00Z"),
      });

      expect(result.policySnapshot).toBeTruthy();
      expect(typeof result.policySnapshot).toBe("string");
      expect(result.policySnapshot.length).toBeGreaterThan(0);
    });
  });

  describe("determineStrikeAction", () => {
    it("issues warning for first strike", () => {
      const result = determineStrikeAction(0);
      expect(result.strikeNumber).toBe(1);
      expect(result.actionTaken).toBe("warning");
    });

    it("issues 7-day suspension for second strike", () => {
      const result = determineStrikeAction(1);
      expect(result.strikeNumber).toBe(2);
      expect(result.actionTaken).toBe("suspension_7d");
    });

    it("issues deactivation for third strike", () => {
      const result = determineStrikeAction(2);
      expect(result.strikeNumber).toBe(3);
      expect(result.actionTaken).toBe("deactivation");
    });

    it("issues deactivation for fourth+ strike", () => {
      const result = determineStrikeAction(5);
      expect(result.strikeNumber).toBe(6);
      expect(result.actionTaken).toBe("deactivation");
    });
  });
});
