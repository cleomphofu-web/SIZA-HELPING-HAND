import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import { createMockPaymentProvider, signMockWebhook } from "@/server/payments/mock";
import { getPaymentProvider, resetPaymentProvider } from "@/server/payments/index";

describe("PaymentProvider", () => {
  beforeEach(() => {
    resetPaymentProvider();
  });

  describe("MockPaymentProvider", () => {
    const provider = createMockPaymentProvider();

    it("creates checkout with deterministic URL and provider ref", async () => {
      const result = await provider.createCheckout({
        bookingId: "booking-123",
        amountCents: 36000,
        returnUrl: "https://siza.co.za/app/bookings/123",
        idempotencyKey: "idem-456",
      });

      expect(result.url).toContain("mock-checkout");
      expect(result.url).toContain("idem-456");
      expect(result.url).toContain("36000");
      expect(result.providerRef).toBe("mock_ref_idem-456");
    });

    it("verifies webhook with valid signature", async () => {
      const payload = JSON.stringify({
        event: "charge.success",
        data: {
          reference: "mock_ref_idem-456",
          amount: 36000,
          currency: "ZAR",
          metadata: { booking_id: "booking-123" },
        },
      });

      const signature = signMockWebhook(payload);
      const headers = new Headers({ "x-paystack-signature": signature });

      const event = await provider.verifyWebhook(payload, headers);
      expect(event).not.toBeNull();
      expect(event?.eventType).toBe("charge.success");
      expect(event?.providerRef).toBe("mock_ref_idem-456");
      expect(event?.amountCents).toBe(36000);
      expect(event?.currency).toBe("ZAR");
      expect(event?.metadata.booking_id).toBe("booking-123");
    });

    it("rejects webhook with missing signature header", async () => {
      const payload = JSON.stringify({ event: "charge.success" });
      const headers = new Headers();

      const event = await provider.verifyWebhook(payload, headers);
      expect(event).toBeNull();
    });

    it("rejects webhook with invalid signature", async () => {
      const payload = JSON.stringify({ event: "charge.success" });
      const headers = new Headers({ "x-paystack-signature": "bogus-signature" });

      const event = await provider.verifyWebhook(payload, headers);
      expect(event).toBeNull();
    });

    it("rejects webhook when payload was tampered after signing", async () => {
      const originalPayload = JSON.stringify({ event: "charge.success", data: { amount: 36000 } });
      const signature = signMockWebhook(originalPayload);

      const tamperedPayload = JSON.stringify({ event: "charge.success", data: { amount: 1000 } });
      const headers = new Headers({ "x-paystack-signature": signature });

      const event = await provider.verifyWebhook(tamperedPayload, headers);
      expect(event).toBeNull();
    });

    it("handles charge.failed event", async () => {
      const payload = JSON.stringify({
        event: "charge.failed",
        data: {
          reference: "mock_ref_failed",
          amount: 36000,
          currency: "ZAR",
        },
      });

      const signature = signMockWebhook(payload);
      const headers = new Headers({ "x-paystack-signature": signature });

      const event = await provider.verifyWebhook(payload, headers);
      expect(event?.eventType).toBe("charge.failed");
      expect(event?.providerRef).toBe("mock_ref_failed");
    });

    it("processes refunds correctly", async () => {
      const refundResult = await provider.refund("mock_ref_123", 26000, "refund-idem-789");
      expect(refundResult.success).toBe(true);
      expect(refundResult.providerRef).toBe("mock_refund_mock_ref_123");
      expect(refundResult.refundedAmountCents).toBe(26000);
    });
  });

  describe("getPaymentProvider factory", () => {
    it("returns mock provider when PAYSTACK_SECRET_KEY is absent", () => {
      delete process.env.PAYSTACK_SECRET_KEY;
      delete process.env.PAYSTACK_WEBHOOK_SECRET;

      const provider = getPaymentProvider();
      expect(provider).toBeDefined();
    });

    it("returns singleton instance on subsequent calls", () => {
      const provider1 = getPaymentProvider();
      const provider2 = getPaymentProvider();
      expect(provider1).toBe(provider2);
    });
  });
});
