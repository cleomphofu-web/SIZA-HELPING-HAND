import "server-only";

// ── Webhook event from payment provider ──
export interface WebhookEvent {
  eventType: "charge.success" | "charge.failed" | "refund.processed";
  providerRef: string;
  amountCents: number;
  currency: string;
  metadata: Record<string, string>;
}

// ── Refund result ──
export interface RefundResult {
  success: boolean;
  providerRef: string;
  refundedAmountCents: number;
}

// ── Payout input and result (Phase B2, optional) ──
export interface PayoutInput {
  recipientCode: string;
  amountCents: number;
  reason: string;
  idempotencyKey: string;
}

export interface PayoutResult {
  success: boolean;
  transferRef: string;
  amountCents: number;
}

// ── Core payment provider interface ──
export interface PaymentProvider {
  createCheckout(input: {
    bookingId: string;
    amountCents: number;
    returnUrl: string;
    idempotencyKey: string;
    metadata?: Record<string, string>;
  }): Promise<{ url: string; providerRef: string }>;

  verifyWebhook(rawBody: string, headers: Headers): Promise<WebhookEvent | null>;

  refund(
    providerRef: string,
    amountCents: number,
    idempotencyKey: string,
  ): Promise<RefundResult>;

  payout?(input: PayoutInput): Promise<PayoutResult>;
}
