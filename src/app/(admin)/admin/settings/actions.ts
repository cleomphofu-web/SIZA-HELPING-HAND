"use server";

import { revalidatePath } from "next/cache";
import { runServerActionPipeline } from "@/server/policies/request-pipeline";
import { requireAdmin } from "@/server/policies/auth";
import { limitAdminAction } from "@/server/security/admin-rate-limit";
import { UpdateRateCardSchema, UpdateTransportZoneSchema, UpdateAppConfigSchema } from "@/server/domain/admin-settings";
import { updateRateCard, updateTransportZone, updateAppConfig } from "@/server/services/admin-settings";
import { fail, type Result } from "@/server/services/result";
import { createSupabaseAdminClient } from "@/server/db/admin";

export async function updateRateCardAction(
  prevState: unknown,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  const rawInput = {
    id: formData.get("id"),
    hourly_cents: formData.get("hourly_cents"),
    per_bedroom_minutes: formData.get("per_bedroom_minutes"),
    per_bathroom_minutes: formData.get("per_bathroom_minutes"),
  };

  const pipeline = await runServerActionPipeline({
    rateLimit: limitAdminAction,
    botCheck: async () => true,
    validate: async () => {
      const parsed = UpdateRateCardSchema.safeParse(rawInput);
      return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "invalid" };
    },
    authorize: async () => ({ ok: true as const, data: await requireAdmin() }),
    service: async (input) => updateRateCard(createSupabaseAdminClient(), input),
  });

  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return fail("rate_limited", "Please wait before changing rates.");
    return fail("validation_failed", "Please check the values and try again.");
  }

  const result = pipeline.data as Result<{ id: string }>;
  if (result.ok) revalidatePath("/admin/settings");
  return result;
}

export async function updateTransportZoneAction(
  prevState: unknown,
  formData: FormData,
): Promise<Result<{ suburb: string }>> {
  const rawInput = {
    suburb: formData.get("suburb"),
    transport_cents: formData.get("transport_cents"),
    enabled: formData.get("enabled"),
  };

  const pipeline = await runServerActionPipeline({
    rateLimit: limitAdminAction,
    botCheck: async () => true,
    validate: async () => {
      const parsed = UpdateTransportZoneSchema.safeParse(rawInput);
      return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "invalid" };
    },
    authorize: async () => ({ ok: true as const, data: await requireAdmin() }),
    service: async (input) => updateTransportZone(createSupabaseAdminClient(), input),
  });

  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return fail("rate_limited", "Please wait before changing zones.");
    return fail("validation_failed", "Please check the values and try again.");
  }

  const result = pipeline.data as Result<{ suburb: string }>;
  if (result.ok) revalidatePath("/admin/settings");
  return result;
}

export async function updateAppConfigAction(
  prevState: unknown,
  formData: FormData,
): Promise<Result<{ key: string }>> {
  const rawInput = {
    key: formData.get("key"),
    value: formData.get("value"),
  };

  const pipeline = await runServerActionPipeline({
    rateLimit: limitAdminAction,
    botCheck: async () => true,
    validate: async () => {
      const parsed = UpdateAppConfigSchema.safeParse(rawInput);
      return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "invalid" };
    },
    authorize: async () => ({ ok: true as const, data: await requireAdmin() }),
    service: async (input) => updateAppConfig(createSupabaseAdminClient(), input),
  });

  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return fail("rate_limited", "Please wait before changing settings.");
    return fail("validation_failed", "Please check the value and try again.");
  }

  const result = pipeline.data as Result<{ key: string }>;
  if (result.ok) revalidatePath("/admin/settings");
  return result;
}
