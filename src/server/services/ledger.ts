import "server-only";

import { ok, fail } from "@/server/services/result";
import type { Result } from "@/server/services/result";

// ── Types ──

export type LedgerEntryKind =
  | "host_payment"
  | "held"
  | "platform_fee"
  | "helper_payable"
  | "payout"
  | "refund"
  | "adjustment";

export interface LedgerEntry {
  id: string;
  bookingId: string;
  paymentId: string | null;
  kind: LedgerEntryKind;
  amountCents: bigint;
  description: string;
  ref: string | null;
  createdAt: string;
}

export interface LedgerWriteInput {
  bookingId: string;
  paymentId?: string;
  kind: LedgerEntryKind;
  amountCents: bigint;
  description: string;
  ref?: string;
}

// ── Db type (Supabase client) ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

// ── Service functions ──

/**
 * Record a single ledger entry. Returns the created entry ID.
 * Ledger rows are append-only (enforced by DB trigger).
 */
export async function recordLedgerEntry(
  db: Db,
  input: LedgerWriteInput,
): Promise<Result<{ id: string }>> {
  if (input.amountCents <= BigInt(0)) {
    return fail("validation_failed", "Ledger entry amount must be positive");
  }

  const { data, error } = await db
    .from("ledger_entries")
    .insert({
      booking_id: input.bookingId,
      payment_id: input.paymentId ?? null,
      kind: input.kind,
      amount_cents: input.amountCents.toString(),
      description: input.description,
      ref: input.ref ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return fail("internal_error", "Failed to record ledger entry");
  }

  return ok({ id: data.id as string });
}

/**
 * Record the full set of ledger entries for a successful host payment.
 * This creates three entries in one call:
 * 1. host_payment (total paid)
 * 2. platform_fee (siZa's service fee)
 * 3. helper_payable (amount owed to helpers)
 *
 * Invariant: host_payment = platform_fee + helper_payable
 */
export async function recordPaymentLedgerEntries(
  db: Db,
  input: {
    bookingId: string;
    paymentId: string;
    totalCents: bigint;
    platformFeeCents: bigint;
    helperPayableCents: bigint;
  },
): Promise<Result<{ entryIds: string[] }>> {
  // Validate the reconciliation invariant
  if (input.totalCents !== input.platformFeeCents + input.helperPayableCents) {
    return fail(
      "validation_failed",
      "Ledger invariant violated: total must equal platform_fee + helper_payable",
    );
  }

  if (input.totalCents <= BigInt(0)) {
    return fail("validation_failed", "Payment total must be positive");
  }

  if (input.platformFeeCents < BigInt(0)) {
    return fail("validation_failed", "Platform fee cannot be negative");
  }

  if (input.helperPayableCents <= BigInt(0)) {
    return fail("validation_failed", "Helper payable must be positive");
  }

  const entries = [
    {
      booking_id: input.bookingId,
      payment_id: input.paymentId,
      kind: "host_payment" as const,
      amount_cents: input.totalCents.toString(),
      description: "Host payment received",
      ref: null,
    },
    {
      booking_id: input.bookingId,
      payment_id: input.paymentId,
      kind: "platform_fee" as const,
      amount_cents: input.platformFeeCents.toString(),
      description: "siZa service fee",
      ref: null,
    },
    {
      booking_id: input.bookingId,
      payment_id: input.paymentId,
      kind: "helper_payable" as const,
      amount_cents: input.helperPayableCents.toString(),
      description: "Amount payable to helpers",
      ref: null,
    },
  ];

  const { data, error } = await db
    .from("ledger_entries")
    .insert(entries)
    .select("id");

  if (error) {
    return fail("internal_error", "Failed to record payment ledger entries");
  }

  return ok({ entryIds: (data as { id: string }[]).map((d) => d.id) });
}

/**
 * Record a refund ledger entry. Creates an offsetting refund row.
 */
export async function recordRefundLedgerEntry(
  db: Db,
  input: {
    bookingId: string;
    paymentId: string;
    refundAmountCents: bigint;
    description: string;
    ref?: string;
  },
): Promise<Result<{ id: string }>> {
  if (input.refundAmountCents <= BigInt(0)) {
    return fail("validation_failed", "Refund amount must be positive");
  }

  return recordLedgerEntry(db, {
    bookingId: input.bookingId,
    paymentId: input.paymentId,
    kind: "refund",
    amountCents: input.refundAmountCents,
    description: input.description,
    ref: input.ref,
  });
}

/**
 * Record a payout ledger entry when admin sends EFT to helper.
 */
export async function recordPayoutLedgerEntry(
  db: Db,
  input: {
    bookingId: string;
    amountCents: bigint;
    description: string;
    ref: string;
  },
): Promise<Result<{ id: string }>> {
  if (input.amountCents <= BigInt(0)) {
    return fail("validation_failed", "Payout amount must be positive");
  }

  return recordLedgerEntry(db, {
    bookingId: input.bookingId,
    kind: "payout",
    amountCents: input.amountCents,
    description: input.description,
    ref: input.ref,
  });
}

/**
 * Verify the reconciliation invariant for a booking:
 * sum(host_payment) - sum(refund) = sum(platform_fee) + sum(helper_payable)
 */
export async function verifyBookingReconciliation(
  db: Db,
  bookingId: string,
): Promise<Result<{ balanced: boolean; hostPayments: bigint; refunds: bigint; platformFees: bigint; helperPayables: bigint }>> {
  const { data, error } = await db
    .from("ledger_entries")
    .select("kind, amount_cents")
    .eq("booking_id", bookingId);

  if (error) {
    return fail("internal_error", "Failed to read ledger entries");
  }

  const entries = data as { kind: LedgerEntryKind; amount_cents: string }[];

  let hostPayments = BigInt(0);
  let refunds = BigInt(0);
  let platformFees = BigInt(0);
  let helperPayables = BigInt(0);

  for (const entry of entries) {
    const cents = BigInt(entry.amount_cents);
    switch (entry.kind) {
      case "host_payment":
        hostPayments += cents;
        break;
      case "refund":
        refunds += cents;
        break;
      case "platform_fee":
        platformFees += cents;
        break;
      case "helper_payable":
        helperPayables += cents;
        break;
      // payout, held, adjustment do not affect the booking balance invariant
    }
  }

  const balanced = hostPayments - refunds === platformFees + helperPayables;

  return ok({ balanced, hostPayments, refunds, platformFees, helperPayables });
}

/**
 * Calculate the service fee for a booking.
 * Fee = max(total * feePercent / 100, feeMinCents)
 * All math in integer cents.
 */
export function calculateServiceFee(
  totalPayCents: bigint,
  feePercent: number,
  feeMinCents: bigint,
): bigint {
  const percentFee = (totalPayCents * BigInt(feePercent)) / BigInt(100);
  return percentFee > feeMinCents ? percentFee : feeMinCents;
}

