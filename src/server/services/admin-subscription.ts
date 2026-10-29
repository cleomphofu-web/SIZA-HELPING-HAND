import "server-only";

import { createSupabaseAdminClient } from "@/server/db/admin";
import { fail, ok, type Result } from "@/server/services/result";
import type { RecordSubscriptionPaymentInput } from "@/server/domain/admin-subscription";

export type RecordSubscriptionResult = {
  paymentId: string;
  subscriptionStatus: string;
  paidUntil: string;
};

export async function recordClearedHelperSubscription(
  actorId: string,
  input: RecordSubscriptionPaymentInput
): Promise<Result<RecordSubscriptionResult>> {
  const { data, error } = await createSupabaseAdminClient().rpc("admin_record_helper_subscription", {
    p_actor_id: actorId,
    p_helper_id: input.helperId,
    p_amount_cents: input.amountCents,
    p_period_months: input.periodMonths,
    p_reference: input.reference,
  });

  if (error || !data) {
    if (error?.message?.includes("admin_required")) {
      return fail("forbidden", "Only administrators can record subscription payments.");
    }
    if (error?.message?.includes("helper_not_found")) {
      return fail("not_found", "The specified helper profile does not exist.");
    }
    return fail("internal_error", "We could not record this subscription payment. Try again.");
  }

  const payload = data as { payment_id: string; subscription_status: string; paid_until: string };
  return ok({
    paymentId: payload.payment_id,
    subscriptionStatus: payload.subscription_status,
    paidUntil: payload.paid_until,
  });
}

