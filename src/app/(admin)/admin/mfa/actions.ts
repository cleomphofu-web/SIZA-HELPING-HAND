"use server";

import { redirect } from "next/navigation";
import { createHmac } from "node:crypto";
import { AdminMfaCodeSchema, AdminMfaSetupSchema } from "@/server/domain/admin-mfa";
import { requireAdminIdentity } from "@/server/policies/auth";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { runServerActionPipeline } from "@/server/policies/request-pipeline";
import { limitAdminAction, limitAdminMfaVerification } from "@/server/security/admin-rate-limit";
import { reserveAdminMfaCode } from "@/server/services/admin-mfa-replay";

export type AdminMfaActionState =
  | { error: string; enrollment?: never }
  | { error?: never; enrollment: { factorId: string; secret: string; qrCode?: string } };

export async function startAdminMfaEnrollment(_previous: AdminMfaActionState | null, formData: FormData): Promise<AdminMfaActionState> {
  const pipeline = await runServerActionPipeline({
    rateLimit: limitAdminAction,
    botCheck: async () => true,
    validate: async () => {
      const parsed = AdminMfaSetupSchema.safeParse({ intent: formData.get("intent") });
      if (!parsed.success) {
        console.error("Admin MFA validation failed:", parsed.error);
        return { ok: false as const, error: "invalid" };
      }
      return { ok: true as const, data: parsed.data };
    },
    authorize: async () => {
      try {
        const identity = await requireAdminIdentity();
        return { ok: true as const, data: identity };
      } catch (authErr) {
        console.error("Admin MFA authorization threw:", authErr);
        throw authErr;
      }
    },
    service: async (_input, { supabase, userId }) => {
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError || !factors) {
        console.error("Admin MFA listFactors error:", listError);
        return { ok: false as const };
      }
      const allFactors = factors.all ?? factors.totp ?? [];
      if (allFactors.some((factor) => factor.status === "verified")) {
        console.error("Admin MFA factor already verified");
        return { ok: false as const };
      }
      const adminClient = createSupabaseAdminClient();
      for (const factor of allFactors) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id }).catch(() => null);
        await adminClient.auth.admin.mfa.deleteFactor({ userId, id: factor.id }).catch(() => null);
      }
      if (typeof adminClient?.auth?.admin?.mfa?.listFactors === "function") {
        const { data: adminFactors } = await adminClient.auth.admin.mfa.listFactors({ userId }).catch(() => ({ data: null }));
        for (const factor of adminFactors?.factors ?? []) {
          await adminClient.auth.admin.mfa.deleteFactor({ userId, id: factor.id }).catch(() => null);
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "siZa admin authenticator",
      });
      if (error || !data?.totp?.secret || !data.id) {
        console.error("Admin MFA enroll error:", error, data);
        return { ok: false as const };
      }
      return {
        ok: true as const,
        enrollment: {
          factorId: data.id,
          secret: data.totp.secret,
          qrCode: data.totp.qr_code,
        },
      };
    },
  });
  if (!pipeline.ok || !pipeline.data.ok) {
    console.error("Admin MFA start enrollment pipeline failed:", pipeline);
    return { error: "We could not start authenticator setup. Try again." };
  }
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
      const allFactors = factors?.all ?? factors?.totp ?? [];
      const factor = allFactors.find((item) => item.id === input.factorId);
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

export async function resetAdminMfaFactor(): Promise<never> {
  await runServerActionPipeline({
    rateLimit: limitAdminAction,
    botCheck: async () => true,
    validate: async () => ({ ok: true as const, data: null }),
    authorize: async () => ({ ok: true as const, data: await requireAdminIdentity() }),
    service: async (_input, { supabase, userId }) => {
      const adminClient = createSupabaseAdminClient();
      const { data: adminFactors } = await adminClient.auth.admin.mfa.listFactors({ userId });
      for (const factor of adminFactors?.factors ?? []) {
        await adminClient.auth.admin.mfa.deleteFactor({ userId, id: factor.id }).catch(() => null);
      }
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const allFactors = factors?.all ?? factors?.totp ?? [];
      for (const factor of allFactors) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id }).catch(() => null);
      }
      return true;
    },
  });
  redirect("/admin/mfa");
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

function base32ToBytes(secret: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const character of secret.replace(/=+$/g, "")) {
    const value = alphabet.indexOf(character);
    if (value < 0) throw new Error("Invalid TOTP secret in local Auth response.");
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  return Buffer.from(bytes);
}

function calculateTotp(secret: string): string {
  const counter = Math.floor(Date.now() / 1000 / 30);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", base32ToBytes(secret)).update(message).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const binary = ((digest[offset]! & 0x7f) << 24) | ((digest[offset + 1]! & 0xff) << 16) | ((digest[offset + 2]! & 0xff) << 8) | (digest[offset + 3]! & 0xff);
  return String(binary % 1_000_000).padStart(6, "0");
}

export async function getDevAdminTotpCode(secretOverride?: string): Promise<string | null> {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_APP_MODE !== "prototype") return null;
  const secret = secretOverride || process.env.DEV_ADMIN_TOTP_SECRET || "SKTP5VN4JKAKZHYYFD7ZQOCXFEJGJBNO";
  try {
    return calculateTotp(secret);
  } catch {
    return null;
  }
}
