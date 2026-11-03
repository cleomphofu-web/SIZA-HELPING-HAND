import "server-only";

import { ok, fail } from "@/server/services/result";
import type { Result } from "@/server/services/result";
import { getPaymentProvider } from "@/server/payments";
import { recordPaymentLedgerEntries } from "@/server/services/ledger";
import { calculateServiceFee } from "@/server/services/ledger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export interface ProcessWebhookResult {
  processed: boolean;
  duplicate: boolean;
  paymentId?: string;
}

/**
 * Handle incoming payment provider webhook.
 * Verifies signature, checks idempotency, updates payment record,
 * and writes ledger entries atomically.
 */
export async function processPaymentWebhook(
  db: Db,
  rawBody: string,
  headers: Headers,
): Promise<Result<ProcessWebhookResult>> {
  const provider = getPaymentProvider();
  const event = await provider.verifyWebhook(rawBody, headers);

  if (!event) {
    return fail("validation_failed", "Invalid webhook signature or unrecognized event");
  }

  // Handle charge.success
  if (event.eventType === "charge.success") {
    // Check if payment with this provider_ref already processed (idempotency)
    const { data: existingPayment } = await db
      .from("payments")
      .select("id, status, booking_id, amount_cents")
      .eq("provider_ref", event.providerRef)
      .maybeSingle();

    if (existingPayment && existingPayment.status === "paid") {
      // Replay of already processed webhook — return ok idempotently
      return ok({ processed: true, duplicate: true, paymentId: existingPayment.id });
    }

    const bookingId = event.metadata.booking_id;
    if (!bookingId) {
      return fail("validation_failed", "Missing booking_id in webhook metadata");
    }

    // Read the booking to verify amounts
    const { data: booking, error: bookingError } = await db
      .from("phase_a_bookings")
      .select("id, pay_per_helper_cents, transport_per_helper_cents, helpers_needed, service_fee_cents")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return fail("not_found", "Booking not found");
    }

    const helpersNeeded = BigInt(booking.helpers_needed);
    const payPerHelper = BigInt(booking.pay_per_helper_cents);
    const transportPerHelper = BigInt(booking.transport_per_helper_cents);
    const helperPayableCents = (payPerHelper + transportPerHelper) * helpersNeeded;

    // Read service fee config if not stored or to verify
    const serviceFeeCents = BigInt(booking.service_fee_cents || 0) > BigInt(0)
      ? BigInt(booking.service_fee_cents)
      : calculateServiceFee(helperPayableCents, 10, BigInt(5000));

    const expectedTotalCents = helperPayableCents + serviceFeeCents;
    const receivedCents = BigInt(event.amountCents);

    // Verify amount matches expected
    if (receivedCents !== expectedTotalCents) {
      return fail(
        "conflict",
        `Payment amount mismatch: expected ${expectedTotalCents.toString()} cents, received ${receivedCents.toString()} cents`,
      );
    }

    let paymentId: string;

    if (existingPayment) {
      // Update pending payment to paid
      paymentId = existingPayment.id;
      const { error: updateError } = await db
        .from("payments")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      if (updateError) {
        return fail("internal_error", "Failed to update payment status");
      }
    } else {
      // Insert new payment record as paid
      const idempotencyKey = event.metadata.idempotency_key || crypto.randomUUID();
      const { data: insertedPayment, error: insertError } = await db
        .from("payments")
        .insert({
          booking_id: bookingId,
          provider: process.env.PAYSTACK_SECRET_KEY ? "paystack" : "mock",
          provider_ref: event.providerRef,
          amount_cents: receivedCents.toString(),
          fee_cents: "0",
          currency: event.currency || "ZAR",
          status: "paid",
          idempotency_key: idempotencyKey,
          paid_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError || !insertedPayment) {
        return fail("internal_error", "Failed to insert payment record");
      }
      paymentId = insertedPayment.id;
    }

    // Record append-only ledger entries
    const ledgerResult = await recordPaymentLedgerEntries(db, {
      bookingId,
      paymentId,
      totalCents: receivedCents,
      platformFeeCents: serviceFeeCents,
      helperPayableCents,
    });

    if (!ledgerResult.ok) {
      return ledgerResult;
    }

    return ok({ processed: true, duplicate: false, paymentId });
  }

  // Handle charge.failed
  if (event.eventType === "charge.failed") {
    await db
      .from("payments")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("provider_ref", event.providerRef);

    return ok({ processed: true, duplicate: false });
  }

  return ok({ processed: true, duplicate: false });
}
