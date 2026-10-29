import { NextRequest, NextResponse } from "next/server";
import { acceptBookingSchema } from "@/lib/schemas";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { assertRole } from "@/server/policies/authorization";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { acceptPhaseABooking } from "@/server/services/phase-a";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { sameOrigin } from "@/server/security/origin";

export async function POST(request: NextRequest) {
  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("accept", request), botCheck: async () => true,
    validate: async () => {
      const payload = request.headers.get("content-type")?.includes("application/json") ? await request.json() : Object.fromEntries(await request.formData());
      const parsed = acceptBookingSchema.safeParse(payload);
      return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "invalid" };
    },
    authorize: async () => {
      if (!sameOrigin(request)) return { ok: false as const, error: "origin" };
      try { const actor = await requireActor(); assertRole(actor, "helper"); return { ok: true as const, data: actor }; } catch { return { ok: false as const, error: "forbidden" }; }
    },
    service: async (input, actor) => ({ bookingId: input.bookingId, result: await acceptPhaseABooking(createSupabaseAdminClient(), actor.userId, input.bookingId, input.slot) }),
  });
  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    const forbidden = pipeline.stage === "authorization";
    return NextResponse.json({ ok: false, error: { code: forbidden ? "forbidden" : "validation_failed", message: forbidden ? "Only helpers can accept jobs." : "That job reference is not valid." } }, { status: forbidden ? 403 : 400 });
  }
  const result = pipeline.data.result;
  if (result.ok && !request.headers.get("content-type")?.includes("application/json")) return NextResponse.redirect(new URL(`/helper/jobs/${pipeline.data.bookingId}`, request.url), 303);
  return NextResponse.json(result, { status: result.ok ? 200 : result.error.code === "already_taken" ? 409 : result.error.code === "subscription_required" ? 403 : 500 });
}
