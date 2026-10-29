import "server-only";

import { createSupabaseAdminClient } from "@/server/db/admin";
import { fail, ok, type Result } from "@/server/services/result";

export type HelperReviewAction = "approve" | "decline" | "suspend";

export async function reviewHelper(actorId: string, helperId: string, action: HelperReviewAction, reason: string | null): Promise<Result<{ changed: boolean }>> {
  const { data, error } = await createSupabaseAdminClient().rpc("admin_review_helper", {
    p_actor_id: actorId,
    p_helper_id: helperId,
    p_action: action,
    p_reason: reason,
  });
  if (error || typeof data !== "boolean") return fail("internal_error", "We could not update this helper decision. Try again in a minute.");
  return ok({ changed: data });
}
