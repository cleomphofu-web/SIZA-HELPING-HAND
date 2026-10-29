import { NextRequest, NextResponse } from "next/server";
import { noShowResolutionSchema } from "@/lib/schemas";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { resolvePhaseANoShowSlot } from "@/server/services/phase-a";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { sameOrigin } from "@/server/security/origin";

export async function POST(request: NextRequest) {
  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("booking", request),
    botCheck: async () => true,
    validate: async () => {
      try {
        const payload = request.headers.get("content-type")?.includes("application/json")
          ? await request.json()
          : Object.fromEntries(await request.formData());
        const parsed = noShowResolutionSchema.safeParse(payload);
        return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "invalid" };
      } catch {
        return { ok: false as const, error: "invalid" };
      }
    },
    authorize: async () => {
      if (!sameOrigin(request)) return { ok: false as const, error: "origin" };
      try {
        const actor = await requireActor();
        return actor.role === "host" ? { ok: true as const, data: actor } : { ok: false as const, error: "forbidden" };
      } catch {
        return { ok: false as const, error: "forbidden" };
      }
    },
    service: async (input, actor) => ({ bookingId: input.bookingId, result: await resolvePhaseANoShowSlot(createSupabaseAdminClient(), actor.userId, input) }),
  });
  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    const forbidden = pipeline.stage === "authorization";
    return NextResponse.json({ ok: false, error: { code: forbidden ? "forbidden" : "validation_failed", message: forbidden ? "Only the host can resolve this vacant slot." : "That slot decision is not valid." } }, { status: forbidden ? 403 : 400 });
  }
  const { bookingId, result } = pipeline.data;
  if (!request.headers.get("content-type")?.includes("application/json")) {
    const destination = result.ok ? `/app/requests/${bookingId}` : `/app/requests/${bookingId}?notice=no_show_resolution_error`;
    return NextResponse.redirect(new URL(destination, request.url), 303);
  }
  return NextResponse.json(result, { status: result.ok ? 200 : result.error.code === "not_found" ? 404 : result.error.code === "forbidden" ? 403 : result.error.code === "conflict" ? 409 : 500 });
}
