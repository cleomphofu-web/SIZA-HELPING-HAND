"use server";

import { revalidatePath } from "next/cache";
import { runServerActionPipeline } from "@/server/policies/request-pipeline";
import { requireAdmin } from "@/server/policies/auth";
import { limitAdminAction } from "@/server/security/admin-rate-limit";
import { RecordSubscriptionPaymentSchema } from "@/server/domain/admin-subscription";
import { recordClearedHelperSubscription, type RecordSubscriptionResult } from "@/server/services/admin-subscription";
import { fail, type Result } from "@/server/services/result";

export async function recordSubscriptionPaymentAction(
  prevState: unknown,
  formData: FormData
): Promise<Result<RecordSubscriptionResult>> {
  const rawInput = {
    helperId: formData.get("helperId"),
    amountCents: formData.get("amountCents"),
    periodMonths: formData.get("periodMonths"),
    reference: formData.get("reference"),
  };

  const pipeline = await runServerActionPipeline({
    rateLimit: limitAdminAction,
    botCheck: async () => true,
    validate: async () => {
      const parsed = RecordSubscriptionPaymentSchema.safeParse(rawInput);
      return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "invalid" };
    },
    authorize: async () => ({ ok: true as const, data: await requireAdmin() }),
    service: async (input, admin) => {
      return recordClearedHelperSubscription(admin.userId, input);
    },
  });

  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") {
      return fail("rate_limited", "Please wait before recording another payment.");
    }
    return fail("validation_failed", "Please check the amount and reference.");
  }

  const result = pipeline.data;
  if (!result.ok) {
    return result;
  }

  revalidatePath("/admin/payments");
  revalidatePath(`/admin/helpers/${rawInput.helperId}`);
  return result;
}
