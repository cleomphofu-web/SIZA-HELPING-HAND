import "server-only";

import type { PaymentProvider } from "@/server/domain/payment-provider";
import { createPaystackProvider } from "@/server/payments/paystack";
import { createMockPaymentProvider } from "@/server/payments/mock";

let _provider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (_provider) return _provider;

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;

  if (secretKey && webhookSecret) {
    _provider = createPaystackProvider(secretKey, webhookSecret);
  } else {
    _provider = createMockPaymentProvider();
  }

  return _provider;
}

/** Reset cached provider (for testing) */
export function resetPaymentProvider(): void {
  _provider = null;
}
