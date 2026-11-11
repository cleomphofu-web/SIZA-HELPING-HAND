import "server-only";

import { createSupabaseAdminClient } from "@/server/db/admin";
import { fail, ok, type Result } from "@/server/services/result";

export type HelperReviewAction = "approve" | "decline" | "suspend";

export async function reviewHelper(actorId: string, helperId: string, action: HelperReviewAction, reason: string | null): Promise<Result<{ changed: boolean }>> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("admin_review_helper", {
    p_actor_id: actorId,
    p_helper_id: helperId,
    p_action: action,
    p_reason: reason,
  });
  if (error || typeof data !== "boolean") return fail("internal_error", "We could not update this helper decision. Try again in a minute.");

  if (data && (action === "approve" || action === "decline")) {
    try {
      if (typeof supabase.from === "function") {
        const { data: profile } = await supabase.from("profiles").select("first_name").eq("id", helperId).maybeSingle();
        const firstName = profile?.first_name || "Helper";

        let email: string | null = null;
        if (supabase.auth?.admin?.getUserById) {
          const { data: userData } = await supabase.auth.admin.getUserById(helperId);
          email = userData?.user?.email ?? null;
        }

        if (email) {
          const { enqueueAndSendEmail } = await import("@/server/email/outbox");
          await enqueueAndSendEmail(supabase, {
            eventType: action === "approve" ? "helper-approved" : "helper-declined",
            recipient: email,
            entityId: helperId,
            variables: { firstName },
          });
        }

        const { createNotification } = await import("@/server/services/notifications");
        await createNotification({
          userId: helperId,
          kind: action === "approve" ? "job_offer" : "no_show_resolved",
          title: action === "approve" ? "Profile approved" : "About your application",
          body: action === "approve"
            ? "Welcome to siZa. You can now see and accept jobs. Your first completed job is free."
            : "We cannot approve your profile right now. Please check your account for an update.",
          actionPath: action === "approve" ? "/helper/jobs" : "/helper/profile",
          referenceId: helperId,
        });
      }
    } catch {
      // Non-blocking notification
    }
  }

  return ok({ changed: data });
}
