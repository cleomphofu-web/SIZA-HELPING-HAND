import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  calculateServiceFee,
  recordPaymentLedgerEntries,
  recordLedgerEntry,
} from "@/server/services/ledger";

describe("Ledger service", () => {
  describe("calculateServiceFee", () => {
    it("returns percentage fee when above minimum", () => {
      // R360 total (36000 cents), 10% fee = R36 (3600 cents), min R50 (5000 cents)
      // 3600 < 5000, so minimum applies
      const fee = calculateServiceFee(BigInt(36000), 10, BigInt(5000));
      expect(fee).toBe(BigInt(5000));
    });

    it("returns minimum fee when percentage is below minimum", () => {
      const fee = calculateServiceFee(BigInt(10000), 10, BigInt(5000));
      // 10% of 10000 = 1000, below minimum 5000
      expect(fee).toBe(BigInt(5000));
    });

    it("returns percentage fee when above minimum", () => {
      // R1000 total (100000 cents), 10% = R100 (10000 cents), min R50 (5000)
      const fee = calculateServiceFee(BigInt(100000), 10, BigInt(5000));
      expect(fee).toBe(BigInt(10000));
    });

    it("handles zero total gracefully", () => {
      const fee = calculateServiceFee(BigInt(0), 10, BigInt(5000));
      expect(fee).toBe(BigInt(5000)); // minimum applies
    });

    it("uses integer division (no floats)", () => {
      // R333 (33300 cents), 10% = 3330 cents (exact integer division)
      const fee = calculateServiceFee(BigInt(33300), 10, BigInt(1000));
      expect(fee).toBe(BigInt(3330));
    });

    it("handles odd percentage correctly with integer math", () => {
      // R100 (10000 cents), 7% = 700 cents
      const fee = calculateServiceFee(BigInt(10000), 7, BigInt(500));
      expect(fee).toBe(BigInt(700));
    });
  });

  describe("recordPaymentLedgerEntries invariant", () => {
    it("rejects when total does not equal platform_fee + helper_payable", async () => {
      const db = {
        from: () => {
          throw new Error("DB should not be called when validation fails");
        },
      };

      const result = await recordPaymentLedgerEntries(db, {
        bookingId: "test-booking",
        paymentId: "test-payment",
        totalCents: BigInt(36000),
        platformFeeCents: BigInt(7000), // 7000 + 20000 ≠ 36000
        helperPayableCents: BigInt(20000),
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("validation_failed");
        expect(result.error.message).toContain("invariant");
      }
    });

    it("rejects negative platform fee", async () => {
      const db = {
        from: () => {
          throw new Error("DB should not be called");
        },
      };

      const result = await recordPaymentLedgerEntries(db, {
        bookingId: "test-booking",
        paymentId: "test-payment",
        totalCents: BigInt(30000),
        platformFeeCents: BigInt(-5000),
        helperPayableCents: BigInt(35000),
      });

      expect(result.ok).toBe(false);
    });

    it("rejects zero total", async () => {
      const db = {
        from: () => {
          throw new Error("DB should not be called");
        },
      };

      const result = await recordPaymentLedgerEntries(db, {
        bookingId: "test-booking",
        paymentId: "test-payment",
        totalCents: BigInt(0),
        platformFeeCents: BigInt(0),
        helperPayableCents: BigInt(0),
      });

      expect(result.ok).toBe(false);
    });

    it("rejects zero helper payable", async () => {
      const db = {
        from: () => {
          throw new Error("DB should not be called");
        },
      };

      const result = await recordPaymentLedgerEntries(db, {
        bookingId: "test-booking",
        paymentId: "test-payment",
        totalCents: BigInt(7000),
        platformFeeCents: BigInt(7000),
        helperPayableCents: BigInt(0),
      });

      expect(result.ok).toBe(false);
    });
  });

  describe("recordLedgerEntry validation", () => {
    it("rejects zero amount", async () => {
      const db = {
        from: () => {
          throw new Error("DB should not be called");
        },
      };

      const result = await recordLedgerEntry(db, {
        bookingId: "test",
        kind: "host_payment",
        amountCents: BigInt(0),
        description: "test",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("validation_failed");
      }
    });

    it("rejects negative amount", async () => {
      const db = {
        from: () => {
          throw new Error("DB should not be called");
        },
      };

      const result = await recordLedgerEntry(db, {
        bookingId: "test",
        kind: "refund",
        amountCents: BigInt(-100),
        description: "test",
      });

      expect(result.ok).toBe(false);
    });
  });
});
