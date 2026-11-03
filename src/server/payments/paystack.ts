import "server-only";

import type {
  PaymentProvider,
  WebhookEvent,
  RefundResult,
} from "@/server/domain/payment-provider";

const PAYSTACK_BASE = "https://api.paystack.co";

export function createPaystackProvider(secretKey: string, webhookSecret: string): PaymentProvider {
  async function paystackFetch(path: string, options: RequestInit = {}): Promise<Response> {
    return fetch(`${PAYSTACK_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  }

  return {
    async createCheckout(input) {
      const body = {
        amount: input.amountCents,
        currency: "ZAR",
        email: input.metadata?.email ?? "customer@siza.co.za",
        reference: input.idempotencyKey,
        callback_url: input.returnUrl,
        metadata: {
          booking_id: input.bookingId,
          idempotency_key: input.idempotencyKey,
          ...input.metadata,
        },
      };

      const res = await paystackFetch("/transaction/initialize", {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Paystack checkout creation failed: ${res.status}`);
      }

      const data = await res.json();
      return {
        url: data.data.authorization_url,
        providerRef: data.data.reference,
      };
    },

    async verifyWebhook(rawBody, headers) {
      const signature = headers.get("x-paystack-signature");
      if (!signature) return null;

      // HMAC-SHA512 verification
      const { createHmac } = await import("node:crypto");
      const expectedSignature = createHmac("sha512", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (signature !== expectedSignature) return null;

      const payload = JSON.parse(rawBody);
      const event = payload.event as string;

      if (event === "charge.success") {
        return {
          eventType: "charge.success" as const,
          providerRef: payload.data.reference,
          amountCents: payload.data.amount,
          currency: payload.data.currency,
          metadata: payload.data.metadata ?? {},
        };
      }

      if (event === "charge.failed") {
        return {
          eventType: "charge.failed" as const,
          providerRef: payload.data.reference,
          amountCents: payload.data.amount,
          currency: payload.data.currency,
          metadata: payload.data.metadata ?? {},
        };
      }

      if (event === "refund.processed") {
        return {
          eventType: "refund.processed" as const,
          providerRef: payload.data.transaction.reference,
          amountCents: payload.data.amount,
          currency: payload.data.currency ?? "ZAR",
          metadata: payload.data.metadata ?? {},
        };
      }

      // Unknown event type — ignore
      return null;
    },

    async refund(providerRef, amountCents, idempotencyKey) {
      // First, get the transaction ID from the reference
      const verifyRes = await paystackFetch(`/transaction/verify/${encodeURIComponent(providerRef)}`);
      if (!verifyRes.ok) {
        throw new Error(`Paystack transaction verify failed: ${verifyRes.status}`);
      }
      const verifyData = await verifyRes.json();
      const transactionId = verifyData.data.id;

      const body = {
        transaction: transactionId,
        amount: amountCents,
        merchant_note: `Refund for booking (key: ${idempotencyKey})`,
      };

      const res = await paystackFetch("/refund", {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`Paystack refund failed: ${res.status}`);
      }

      const data = await res.json();
      return {
        success: data.data.status === "processed" || data.data.status === "pending",
        providerRef: String(data.data.id),
        refundedAmountCents: data.data.amount,
      };
    },
  };
}
