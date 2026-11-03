import "server-only";

import { ok, fail } from "@/server/services/result";
import type { Result } from "@/server/services/result";

// ── Types ──

export type CancellationType =
  | "host_before_assignment"
  | "host_gt_4h"
  | "host_lt_4h"
  | "helper_no_show";

export interface CancellationResult {
  type: CancellationType;
  refundAmountCents: bigint;
  helperCompensationCents: bigint;
  policySnapshot: string;
}

export interface StrikeResult {
  strikeNumber: number;
  actionTaken: "warning" | "suspension_7d" | "deactivation";
}

// ── Db type ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

// ── Cancellation policy ──

/**
 * Determine the cancellation type and financial outcome.
 * All amounts in integer cents (bigint).
 *
 * Rules:
 * - Before assignment: full refund, no compensation
 * - >4 hours before start: full refund, no compensation
 * - <4 hours before start: R100 helper transport compensation, remainder refunded
 * - Helper no-show: full refund to host, strike to helper
 *
 * TODO(owner): confirm exact cancellation fee amounts with legal counsel
 */
export function determineCancellation(input: {
  bookingStatus: string;
  startAt: Date;
  cancelledAt: Date;
  totalPaidCents: bigint;
  cancelledByRole: "host" | "helper" | "admin";
  isNoShow: boolean;
  helperCompensationCents: bigint; // from app_config
}): CancellationResult {
  const {
    bookingStatus,
    startAt,
    cancelledAt,
    totalPaidCents,
    cancelledByRole,
    isNoShow,
    helperCompensationCents,
  } = input;

  // Helper no-show: full refund to host
  if (isNoShow) {
    return {
      type: "helper_no_show",
      refundAmountCents: totalPaidCents,
      helperCompensationCents: BigInt(0),
      policySnapshot: "Helper no-show: full refund to host. Strike issued to helper.",
    };
  }

  // Host cancellation before assignment
  if (bookingStatus === "open") {
    return {
      type: "host_before_assignment",
      refundAmountCents: totalPaidCents,
      helperCompensationCents: BigInt(0),
      policySnapshot: "Cancelled before helper assignment: full refund.",
    };
  }

  // Calculate hours until start
  const msUntilStart = startAt.getTime() - cancelledAt.getTime();
  const hoursUntilStart = msUntilStart / (1000 * 60 * 60);

  // Host cancellation >4 hours before start
  if (cancelledByRole === "host" && hoursUntilStart > 4) {
    return {
      type: "host_gt_4h",
      refundAmountCents: totalPaidCents,
      helperCompensationCents: BigInt(0),
      policySnapshot: "Cancelled more than 4 hours before start: full refund.",
    };
  }

  // Host cancellation <4 hours before start
  if (cancelledByRole === "host" && hoursUntilStart <= 4) {
    // Helper gets transport compensation; host gets remainder
    const compensation = helperCompensationCents > totalPaidCents
      ? totalPaidCents
      : helperCompensationCents;
    const refund = totalPaidCents - compensation;

    return {
      type: "host_lt_4h",
      refundAmountCents: refund,
      helperCompensationCents: compensation,
      policySnapshot: `Cancelled less than 4 hours before start: helper receives transport compensation, remainder refunded to host.`,
    };
  }

  // Default fallback (admin or edge case): full refund
  return {
    type: "host_before_assignment",
    refundAmountCents: totalPaidCents,
    helperCompensationCents: BigInt(0),
    policySnapshot: "Administrative cancellation: full refund.",
  };
}

// ── Strike escalation ──

/**
 * Determine the action for a helper strike based on their current strike count.
 *
 * Strike 1: warning
 * Strike 2: 7-day suspension
 * Strike 3+: deactivation
 */
export function determineStrikeAction(currentStrikes: number): StrikeResult {
  const strikeNumber = currentStrikes + 1;

  if (strikeNumber === 1) {
    return { strikeNumber, actionTaken: "warning" };
  }

  if (strikeNumber === 2) {
    return { strikeNumber, actionTaken: "suspension_7d" };
  }

  return { strikeNumber, actionTaken: "deactivation" };
}

/**
 * Record a strike against a helper and apply the appropriate action.
 */
export async function recordStrike(
  db: Db,
  input: {
    helperId: string;
    bookingId: string | null;
    reason: "no_show" | "misconduct" | "fraud";
    reviewerId: string;
    notes?: string;
  },
): Promise<Result<StrikeResult>> {
  // Get current strike count
  const { data: helperData, error: helperError } = await db
    .from("helper_details")
    .select("strikes")
    .eq("user_id", input.helperId)
    .single();

  if (helperError || !helperData) {
    return fail("not_found", "Helper not found");
  }

  const currentStrikes = helperData.strikes as number;
  const action = determineStrikeAction(currentStrikes);

  // Record the strike
  const { error: strikeError } = await db
    .from("strike_records")
    .insert({
      helper_id: input.helperId,
      booking_id: input.bookingId,
      reason: input.reason,
      strike_number: action.strikeNumber,
      action_taken: action.actionTaken,
      reviewer_id: input.reviewerId,
      notes: input.notes ?? "",
    });

  if (strikeError) {
    return fail("internal_error", "Failed to record strike");
  }

  // Update helper_details strikes count
  const { error: updateError } = await db
    .from("helper_details")
    .update({
      strikes: action.strikeNumber,
      updated_at: new Date().toISOString(),
      // Apply suspension or deactivation
      ...(action.actionTaken === "suspension_7d"
        ? { status: "suspended" }
        : {}),
      ...(action.actionTaken === "deactivation"
        ? { status: "declined", decline_reason: `Deactivated: ${action.strikeNumber} strikes (${input.reason})` }
        : {}),
    })
    .eq("user_id", input.helperId);

  if (updateError) {
    return fail("internal_error", "Failed to update helper status");
  }

  return ok(action);
}

/**
 * Record a cancellation with financial details.
 */
export async function recordCancellation(
  db: Db,
  input: {
    bookingId: string;
    cancelledBy: string;
    type: CancellationType;
    refundAmountCents: bigint;
    helperCompensationCents: bigint;
    reason?: string;
    policySnapshot: string;
  },
): Promise<Result<{ id: string }>> {
  const { data, error } = await db
    .from("cancellation_records")
    .insert({
      booking_id: input.bookingId,
      cancelled_by: input.cancelledBy,
      type: input.type,
      refund_amount_cents: input.refundAmountCents.toString(),
      helper_compensation_cents: input.helperCompensationCents.toString(),
      reason: input.reason ?? "",
      policy_snapshot: input.policySnapshot,
    })
    .select("id")
    .single();

  if (error) {
    return fail("internal_error", "Failed to record cancellation");
  }

  return ok({ id: data.id as string });
}

