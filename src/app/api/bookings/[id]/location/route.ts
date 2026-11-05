import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { sameOrigin } from "@/server/security/origin";
import { recordLocationPing, getLatestLocation } from "@/server/services/location-tracking";

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyM: z.number().positive().optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: bookingId } = await context.params;

  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("booking", request),
    botCheck: async () => true,
    validate: async () => {
      try {
        const body = await request.json();
        const parsed = locationSchema.safeParse(body);
        return parsed.success
          ? { ok: true as const, data: parsed.data }
          : { ok: false as const, error: "invalid" };
      } catch {
        return { ok: false as const, error: "invalid" };
      }
    },
    authorize: async () => {
      if (!sameOrigin(request)) return { ok: false as const, error: "origin" };
      try {
        const actor = await requireActor();
        return { ok: true as const, data: actor };
      } catch {
        return { ok: false as const, error: "forbidden" };
      }
    },
    service: async (input, actor) => {
      const adminDb = createSupabaseAdminClient();
      return recordLocationPing(adminDb, {
        bookingId,
        helperId: actor.userId,
        lat: input.lat,
        lng: input.lng,
        accuracyM: input.accuracyM,
      });
    },
  });

  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    const forbidden = pipeline.stage === "authorization";
    return NextResponse.json(
      { error: forbidden ? "Unauthorized" : "Validation failed" },
      { status: forbidden ? 401 : 400 },
    );
  }

  const result = pipeline.data;
  if (!result.ok) {
    if (result.error.code === "forbidden") {
      return NextResponse.json({ error: result.error.message }, { status: 403 });
    }
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ pingId: result.data.pingId }, { status: 201 });
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: bookingId } = await context.params;
  const adminDb = createSupabaseAdminClient();
  const result = await getLatestLocation(adminDb, bookingId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  return NextResponse.json({ data: result.data }, { status: 200 });
}
