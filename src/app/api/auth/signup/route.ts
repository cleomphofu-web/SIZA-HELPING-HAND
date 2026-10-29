import { NextRequest, NextResponse } from "next/server";
import { accountEntrySchema } from "@/lib/schemas";
import { createSupabaseServerClient } from "@/server/db/server";
import { createAccount } from "@/server/services/accounts";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { verifyTurnstile } from "@/server/security/turnstile";
import { sameOrigin } from "@/server/security/origin";

function clientIp(request: NextRequest) { return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"; }

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("login", request),
    botCheck: async () => {
      try { const form = await request.clone().formData(); return verifyTurnstile(String(form.get("turnstileToken") ?? ""), ip); } catch { return false; }
    },
    validate: async () => {
      const form = await request.formData();
      const parsed = accountEntrySchema.safeParse({
        email: form.get("email"), password: form.get("password"), role: form.get("role"), firstName: form.get("firstName"), lastName: form.get("lastName"), phone: form.get("phone"),
        termsVersion: form.get("termsVersion"), privacyVersion: form.get("privacyVersion"), termsAccepted: form.get("termsAccepted") === "on", privacyAccepted: form.get("privacyAccepted") === "on", honeypot: form.get("honeypot") ?? "",
      });
      return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: parsed.error.issues };
    },
    authorize: async () => sameOrigin(request) ? { ok: true as const, data: null } : { ok: false as const, error: "origin" },
    service: async (input) => {
      if (input.honeypot) return { ok: true as const, data: { accepted: true } };
      try {
        await createAccount(input, await createSupabaseServerClient());
      } catch {
        // Keep account existence and provider failures out of the public response.
      }
      return { ok: true as const, data: { accepted: true } };
    },
  });
  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    const code = pipeline.stage === "authorization" ? "forbidden" : "validation_failed";
    const validationMessage =
      Array.isArray(pipeline.error) && pipeline.error[0]?.message
        ? String(pipeline.error[0].message)
        : "Check the highlighted details.";
    const message =
      pipeline.stage === "bot_check"
        ? "We could not verify this request."
        : pipeline.stage === "authorization"
        ? "This request was not accepted."
        : validationMessage;
    return NextResponse.json({ ok: false, error: { code, message } }, { status: pipeline.stage === "authorization" ? 403 : 400 });
  }
  return NextResponse.json({ ok: true, data: { accepted: true } }, { status: 202 });
}
