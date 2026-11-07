import "server-only";

import { createSupabaseServerClient } from "@/server/db/server";
import { fail, ok, type Result } from "@/server/services/result";
import type { HelperYocoSubmissionInput } from "@/server/domain/yoco-subscription";

export type HelperYocoSubmissionResult = {
  submissionId?: string;
  status?: string;
  alreadyCleared?: boolean;
  message: string;
};

export async function submitHelperYocoPayment(
  input: HelperYocoSubmissionInput,
): Promise<Result<HelperYocoSubmissionResult>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("helper_submit_yoco_payment", {
    p_reference: input.reference,
    p_period_months: input.periodMonths,
  });

  if (error || !data) {
    if (error?.message?.includes("invalid_reference")) {
      return fail("validation_failed", "Please enter a valid Yoco payment reference.");
    }
    if (error?.message?.includes("unauthenticated")) {
      return fail("unauthenticated", "You must be signed in to submit a payment reference.");
    }
    if (error?.message?.includes("helper_required")) {
      return fail("forbidden", "Only registered helpers can submit subscription payments.");
    }
    return fail("internal_error", "We could not submit your payment reference. Please try again.");
  }

  const payload = data as {
    ok: boolean;
    submission_id?: string;
    status?: string;
    already_cleared?: boolean;
    error?: string;
    message: string;
  };

  if (!payload.ok) {
    if (payload.error === "duplicate_reference") {
      return fail("conflict", payload.message);
    }
    return fail("validation_failed", payload.message);
  }

  return ok({
    submissionId: payload.submission_id,
    status: payload.status,
    alreadyCleared: payload.already_cleared,
    message: payload.message,
  });
}

