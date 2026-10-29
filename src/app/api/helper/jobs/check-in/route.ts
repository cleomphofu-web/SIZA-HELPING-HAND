import { NextRequest, NextResponse } from "next/server";
import { checkInSchema } from "@/lib/schemas";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { assertRole } from "@/server/policies/authorization";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { checkInPhaseABooking } from "@/server/services/phase-a";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { sameOrigin } from "@/server/security/origin";

export async function POST(request: NextRequest) {
  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("code_attempt", request), botCheck: async () => true,
    validate: async () => {
      const payload = request.headers.get("content-type")?.includes("application/json") ? await request.json() : Object.fromEntries(await request.formData());
      const parsed = checkInSchema.safeParse(payload);
      return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "invalid" };
    },
    authorize: async () => {
      if (!sameOrigin(request)) return { ok: false as const, error: "origin" };
      try { const actor = await requireActor(); assertRole(actor, "helper"); return { ok: true as const, data: actor }; } catch { return { ok: false as const, error: "forbidden" }; }
    },
    service: async (input, actor) => ({ bookingId: input.bookingId, result: await checkInPhaseABooking(createSupabaseAdminClient(), actor.userId, input) }),
  });
  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    const forbidden = pipeline.stage === "authorization";
    return NextResponse.json({ ok: false, error: { code: forbidden ? "forbidden" : "validation_failed", message: forbidden ? "Only assigned helpers can check in." : "Enter the six-digit check-in code." } }, { status: forbidden ? 403 : 400 });
  }
  const result = pipeline.data.result;
  if (result.ok && !request.headers.get("content-type")?.includes("application/json")) return NextResponse.redirect(new URL(`/helper/jobs/${pipeline.data.bookingId}`, request.url), 303);
  const status = result.ok ? 200 : result.error.code === "locked" ? 423 : result.error.code === "not_found" ? 404 : result.error.code === "conflict" ? 409 : 500;
  return NextResponse.json(result, { status });
}
