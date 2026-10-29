import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/schemas";
import { createSupabaseServerClient } from "@/server/db/server";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { inspectLoginThrottle, recordFailedLogin, recordSuccessfulLogin } from "@/server/security/login-limiter";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { verifyTurnstile } from "@/server/security/turnstile";
import { sameOrigin } from "@/server/security/origin";
import { accountDestinationForRole } from "@/lib/account-destination";
import { t } from "@/content/t";

function clientIp(request: NextRequest) { return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"; }

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  let throttle = { locked: false, challengeRequired: false, retryAfterSeconds: 60 };
  const pipeline = await runRequestPipeline({
    rateLimit: async () => {
      // Read only the candidate identifier to choose the rate-limit key; schema validation still follows Turnstile.
      const form = await request.clone().formData();
      throttle = await inspectLoginThrottle(String(form.get("email") ?? ""), ip);
      return { allowed: !throttle.locked, retryAfterSeconds: throttle.retryAfterSeconds };
    },
    botCheck: async () => {
      if (!throttle.challengeRequired) return true;
      try { const form = await request.clone().formData(); return verifyTurnstile(String(form.get("turnstileToken") ?? ""), ip); } catch { return false; }
    },
    validate: async () => {
      const form = await request.formData();
      const parsed = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
      return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "invalid" };
    },
    authorize: async () => sameOrigin(request) ? { ok: true as const, data: null } : { ok: false as const, error: "origin" },
    service: async (input) => {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.signInWithPassword(input);
      if (error) {
        if (!await recordFailedLogin(input.email, ip)) return { ok: false as const, error: { code: "internal_error", message: "Sign-in is temporarily unavailable. Try again shortly." } };
        return { ok: false as const, error: { code: "unauthenticated", message: "We could not sign you in with those details." } };
      }
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = user
        ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
        : { data: null };
      const destination = accountDestinationForRole(profile?.role);
      if (!destination) {
        await supabase.auth.signOut();
        if (!await recordFailedLogin(input.email, ip)) return { ok: false as const, error: { code: "internal_error", message: "Sign-in is temporarily unavailable. Try again shortly." } };
        return { ok: false as const, error: { code: "unauthenticated", message: "We could not sign you in with those details." } };
      }
      await recordSuccessfulLogin(input.email, ip);
      return { ok: true as const, data: { destination } };
    },
  });
  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    const forbidden = pipeline.stage === "authorization";
    const challengeRequired = pipeline.stage === "bot_check" && throttle.challengeRequired;
    const message = challengeRequired ? t("account.login.challenge") : pipeline.stage === "bot_check" ? "We could not verify this request." : forbidden ? "This request was not accepted." : "Enter your email and password.";
    return NextResponse.json({ ok: false, error: { code: challengeRequired ? "challenge_required" : forbidden ? "forbidden" : "validation_failed", message } }, { status: challengeRequired ? 428 : forbidden ? 403 : 400 });
  }
  const status = pipeline.data.ok ? 200 : pipeline.data.error.code === "internal_error" ? 503 : 401;
  return NextResponse.json(pipeline.data, { status });
}
