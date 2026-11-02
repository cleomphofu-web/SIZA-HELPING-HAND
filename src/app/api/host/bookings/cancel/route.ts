import { NextRequest, NextResponse } from "next/server";
import { CancelBookingSchema } from "@/server/domain/host-booking-manage";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { cancelPhaseABookingByHost } from "@/server/services/phase-a";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { sameOrigin } from "@/server/security/origin";

export async function POST(request: NextRequest) {
  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("booking", request),
    botCheck: async () => true,
    validate: async () => {
      const payload = request.headers.get("content-type")?.includes("application/json")
        ? await request.json()
        : Object.fromEntries(await request.formData());
      const parsed = CancelBookingSchema.safeParse(payload);
      return parsed.success
        ? { ok: true as const, data: parsed.data }
        : { ok: false as const, error: "invalid" };
    },
    authorize: async () => {
      if (!sameOrigin(request)) return { ok: false as const, error: "origin" };
      try {
        const actor = await requireActor();
        if (actor.role !== "host") return { ok: false as const, error: "forbidden" };
        return { ok: true as const, data: actor };
      } catch {
        return { ok: false as const, error: "forbidden" };
      }
    },
    service: async (input, actor) => ({
      result: await cancelPhaseABookingByHost(createSupabaseAdminClient(), actor.userId, input),
      bookingId: input.bookingId,
    }),
  });

  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    const forbidden = pipeline.stage === "authorization";
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: forbidden ? "forbidden" : "validation_failed",
          message: forbidden ? "Only the host may cancel this booking." : "Invalid cancellation data.",
        },
      },
      { status: forbidden ? 403 : 400 },
    );
  }

  const { result, bookingId } = pipeline.data;
  if (!result.ok) {
    const status =
      result.error.code === "not_found" ? 404
      : result.error.code === "forbidden" ? 403
      : result.error.code === "conflict" ? 409
      : 500;
    return NextResponse.json(result, { status });
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.redirect(new URL(`/app/requests/${bookingId}`, request.url), 303);
  }

  return NextResponse.json(result, { status: 200 });
}
