"use server";

import { redirect } from "next/navigation";
import { AdminMfaCodeSchema, AdminMfaSetupSchema } from "@/server/domain/admin-mfa";
import { requireAdminIdentity } from "@/server/policies/auth";
import { runServerActionPipeline } from "@/server/policies/request-pipeline";
import { limitAdminAction, limitAdminMfaVerification } from "@/server/security/admin-rate-limit";
import { reserveAdminMfaCode } from "@/server/services/admin-mfa-replay";

export type AdminMfaActionState =
  | { error: string; enrollment?: never }
  | { error?: never; enrollment: { factorId: string; secret: string } };

export async function startAdminMfaEnrollment(_previous: AdminMfaActionState | null, formData: FormData): Promise<AdminMfaActionState> {
  const pipeline = await runServerActionPipeline({
    rateLimit: limitAdminAction,
    botCheck: async () => true,
    validate: async () => {
      const parsed = AdminMfaSetupSchema.safeParse({ intent: formData.get("intent") });
      return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "invalid" };
    },
    authorize: async () => ({ ok: true as const, data: await requireAdminIdentity() }),
    service: async (_input, { supabase }) => {
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError || !factors) return { ok: false as const };
      if (factors.totp.some((factor) => factor.status === "verified")) return { ok: false as const };
      for (const factor of factors.totp) {
        const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
        if (error) return { ok: false as const };
      }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "SIZA admin authenticator" });
      if (error || !data?.totp?.secret || !data.id) return { ok: false as const };
      return { ok: true as const, enrollment: { factorId: data.id, secret: data.totp.secret } };
    },
  });
  if (!pipeline.ok || !pipeline.data.ok) return { error: "We could not start authenticator setup. Try again." };
  return { enrollment: pipeline.data.enrollment };
}

export async function verifyAdminMfa(formData: FormData): Promise<never> {
  const pipeline = await runServerActionPipeline({
    rateLimit: limitAdminMfaVerification,
    botCheck: async () => true,
    validate: async () => {
      const parsed = AdminMfaCodeSchema.safeParse({ factorId: formData.get("factorId"), code: formData.get("code") });
      return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "invalid" };
    },
    authorize: async () => ({ ok: true as const, data: await requireAdminIdentity() }),
    service: async (input, { supabase }) => {
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      const factor = factors?.totp.find((item) => item.id === input.factorId);
      if (listError || !factor || !["verified", "unverified"].includes(factor.status)) return false;
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id });
      if (challengeError || !challenge?.id) return false;
      if (!(await reserveAdminMfaCode(factor.id, input.code))) return false;
      const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: challenge.id, code: input.code });
      return !verifyError;
    },
  });
  if (!pipeline.ok || !pipeline.data) redirect("/admin/mfa?error=invalid");
  redirect("/admin");
}

export async function signOutFromAdminMfa(): Promise<never> {
  const pipeline = await runServerActionPipeline({
    rateLimit: limitAdminAction,
    botCheck: async () => true,
    validate: async () => ({ ok: true as const, data: null }),
    authorize: async () => ({ ok: true as const, data: await requireAdminIdentity() }),
    service: async (_input, { supabase }) => {
      const { error } = await supabase.auth.signOut();
      return !error;
    },
  });
  if (!pipeline.ok || !pipeline.data) redirect("/admin/mfa?error=setup");
  redirect("/admin/login");
}
