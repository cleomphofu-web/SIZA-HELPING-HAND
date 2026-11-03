import "server-only";

import type {
  PaymentProvider,
  WebhookEvent,
  RefundResult,
} from "@/server/domain/payment-provider";

const MOCK_WEBHOOK_SECRET = "mock_webhook_secret_for_testing";

export function createMockPaymentProvider(): PaymentProvider {
  return {
    async createCheckout(input) {
      return {
        url: `http://localhost:3000/mock-checkout?ref=${input.idempotencyKey}&amount=${input.amountCents}`,
        providerRef: `mock_ref_${input.idempotencyKey}`,
      };
    },

    async verifyWebhook(rawBody, headers) {
      const signature = headers.get("x-paystack-signature");
      if (!signature) return null;

      const { createHmac } = await import("node:crypto");
      const expected = createHmac("sha512", MOCK_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      if (signature !== expected) return null;

      const payload = JSON.parse(rawBody);
      return {
        eventType: payload.event === "charge.success" ? "charge.success" : "charge.failed",
        providerRef: payload.data?.reference ?? "mock_ref",
        amountCents: payload.data?.amount ?? 0,
        currency: payload.data?.currency ?? "ZAR",
        metadata: payload.data?.metadata ?? {},
      } as WebhookEvent;
    },

    async refund(_providerRef, amountCents, _idempotencyKey) {
      return {
        success: true,
        providerRef: `mock_refund_${_providerRef}`,
        refundedAmountCents: amountCents,
      } satisfies RefundResult;
    },
  };
}

/** Helper for tests: generate a valid mock webhook signature */
export function signMockWebhook(body: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHmac } = require("node:crypto") as typeof import("node:crypto");
  return createHmac("sha512", MOCK_WEBHOOK_SECRET).update(body).digest("hex");
}
