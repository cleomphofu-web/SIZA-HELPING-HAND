import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/server/db/server";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { adminPostLoginDestination } from "@/server/services/admin-mfa";
import { loginSchema } from "@/lib/schemas";
import { retryAfterHeaders } from "@/server/security/request-rate-limit";
import { inspectLoginThrottle, recordFailedLogin, recordSuccessfulLogin } from "@/server/security/login-limiter";
import { verifyTurnstile } from "@/server/security/turnstile";
import { sameOrigin } from "@/server/security/origin";
import { runRequestPipeline } from "@/server/policies/request-pipeline";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  let throttle = { locked: false, challengeRequired: false, retryAfterSeconds: 60 };
  const pipeline = await runRequestPipeline({
    rateLimit: async () => {
      const form = await request.clone().formData();
      throttle = await inspectLoginThrottle(String(form.get("email") ?? ""), ip);
      return { allowed: !throttle.locked, retryAfterSeconds: throttle.retryAfterSeconds };
    },
    botCheck: async () => {
      if (!throttle.challengeRequired) return true;
      try { return verifyTurnstile(String((await request.clone().formData()).get("turnstileToken") ?? ""), ip); } catch { return false; }
    },
    validate: async () => {
      const form = await request.formData();
      const parsed = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
      return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "invalid" };
    },
    authorize: async () => sameOrigin(request) ? { ok: true as const, data: null } : { ok: false as const, error: "origin" },
    service: async (input) => {
      const supabase = await createSupabaseServerClient();
      const { data: signedIn, error } = await supabase.auth.signInWithPassword(input);
      if (error) return await recordFailedLogin(input.email, ip) ? "invalid" : "unavailable";
      const user = signedIn.user;
      if (!user) {
        await supabase.auth.signOut();
        return "invalid";
      }
      const adminClient = createSupabaseAdminClient();
      const [{ data: profile, error: profileError }, { data: membership, error: membershipError }] = await Promise.all([
        adminClient.from("profiles").select("role, deleted_at").eq("id", user.id).maybeSingle(),
        adminClient.from("admins").select("user_id").eq("user_id", user.id).maybeSingle(),
      ]);
      if (profileError || membershipError) return "unavailable";
      const isActiveAdmin = profile?.role === "admin" && profile.deleted_at === null && Boolean(membership);
      if (!isActiveAdmin) {
        await supabase.auth.signOut();
        return await recordFailedLogin(input.email, ip) ? "invalid" : "unavailable";
      }
      await recordSuccessfulLogin(input.email, ip);
      const [{ data: factors, error: factorError }, { data: assurance, error: assuranceError }] = await Promise.all([
        supabase.auth.mfa.listFactors(),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);
      if (factorError || assuranceError || !factors) return "/admin/mfa?error=setup";
      const hasVerifiedTotp = factors.totp.some((factor) => factor.status === "verified");
      return adminPostLoginDestination({
        role: profile.role,
        isMember: true,
        hasVerifiedTotp,
        currentLevel: assurance.currentLevel === "aal2" ? "aal2" : assurance.currentLevel === "aal1" ? "aal1" : null,
      });
    },
  });
  if (pipeline.ok && pipeline.data.startsWith("/admin")) return NextResponse.redirect(new URL(pipeline.data, request.url), 303);
  const retry = (!pipeline.ok && pipeline.stage === "rate_limit") || (pipeline.ok && pipeline.data === "unavailable");
  const challenge = throttle.challengeRequired && (!pipeline.ok ? pipeline.stage !== "rate_limit" : pipeline.data !== "success") ? "&challenge=1" : "";
  const response = NextResponse.redirect(new URL(retry ? `/admin/login?error=try-again${challenge}` : `/admin/login?error=invalid${challenge}`, request.url), 303);
  if (retry && !pipeline.ok) response.headers.set("Retry-After", retryAfterHeaders(pipeline)["Retry-After"]);
  return response;
}
