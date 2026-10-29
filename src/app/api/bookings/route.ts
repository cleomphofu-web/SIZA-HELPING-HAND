import { NextRequest, NextResponse } from "next/server";
import { phaseABookingSchema } from "@/lib/schemas";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { assertRole } from "@/server/policies/authorization";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { createPhaseABooking } from "@/server/services/phase-a";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { verifyTurnstile } from "@/server/security/turnstile";
import { sameOrigin } from "@/server/security/origin";

function clientIp(request: NextRequest) { return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"; }

export async function POST(request: NextRequest) {
  const htmlForm = !request.headers.get("content-type")?.includes("application/json");
  const formError = (code: string) => NextResponse.redirect(new URL(`/app/book?error=${code}`, request.url), 303);
  const ip = clientIp(request);
  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("booking", request),
    botCheck: async () => { try { const form = await request.clone().formData(); return verifyTurnstile(String(form.get("turnstileToken") ?? ""), ip); } catch { return false; } },
    validate: async () => {
      const form = await request.formData();
      const fields = Object.fromEntries(form.entries());
      delete fields.turnstileToken;
      const parsed = phaseABookingSchema.safeParse({
        ...fields,
        services: form.getAll("services").map(String),
        addons: form.getAll("addons").map(String),
        outsideAgreementNotice: form.get("outsideAgreementNotice") === "on",
        addressSharingNotice: form.get("addressSharingNotice") === "on",
        paymentNotice: form.get("paymentNotice") === "on",
      });
      return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "invalid" };
    },
    authorize: async () => {
      if (!sameOrigin(request)) return { ok: false as const, error: "origin" };
      try { const actor = await requireActor(); assertRole(actor, "host"); return { ok: true as const, data: actor }; } catch { return { ok: false as const, error: "forbidden" }; }
    },
    service: (input, actor) => createPhaseABooking(createSupabaseAdminClient(), actor.userId, input),
  });
  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return htmlForm ? formError("rate_limited") : rateLimitResponse(pipeline);
    if (htmlForm && pipeline.stage === "bot_check") return formError("verify");
    if (htmlForm && pipeline.stage === "input_validation") return formError("validation");
    const forbidden = pipeline.stage === "authorization";
    const message = pipeline.stage === "bot_check" ? "We could not verify this request." : forbidden ? "Only hosts can create requests." : "Check the highlighted details.";
    return NextResponse.json({ ok: false, error: { code: forbidden ? "forbidden" : "validation_failed", message } }, { status: forbidden ? 403 : 400 });
  }
  const result = pipeline.data;
  if (result.ok && htmlForm) return NextResponse.redirect(new URL(`/app/requests/${result.data.id}`, request.url), 303);
  if (!result.ok && htmlForm) {
    const error = result.error.code === "conflict" ? "not_open" : result.error.code === "validation_failed" ? "pricing" : "failed";
    return formError(error);
  }
  return NextResponse.json(result, { status: result.ok ? 201 : result.error.code === "conflict" ? 409 : 500 });
}
