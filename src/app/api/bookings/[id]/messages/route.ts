import { NextRequest, NextResponse } from "next/server";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { sameOrigin } from "@/server/security/origin";
import { requireActor } from "@/server/policies/auth";
import { bookingMessageSchema } from "@/lib/schemas";
import {
  getBookingMessages,
  postBookingMessage,
} from "@/server/services/booking-messages";

// ── GET /api/bookings/[id]/messages ────────────────────────────────────────

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: bookingId } = await context.params;

  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("booking", request),
    botCheck: async () => true,
    validate: async () => ({ ok: true as const, data: { bookingId } }),
    authorize: async () => {
      if (!sameOrigin(request)) return { ok: false as const, error: "origin" };
      try {
        const actor = await requireActor();
        return { ok: true as const, data: actor };
      } catch {
        return { ok: false as const, error: "unauthenticated" };
      }
    },
    service: async () => {
      return getBookingMessages(bookingId);
    },
  });

  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = pipeline.data;
  if (!result.ok) {
    const status =
      result.error.code === "unauthenticated" ? 401
      : result.error.code === "not_found" ? 404
      : result.error.code === "forbidden" ? 403
      : 400;
    return NextResponse.json({ error: result.error.message }, { status });
  }

  return NextResponse.json({ ok: true, data: result.data }, { status: 200 });
}

// ── POST /api/bookings/[id]/messages ───────────────────────────────────────

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
        const body = await request.json().catch(() => ({}));
        const parsed = bookingMessageSchema.safeParse({ bookingId, ...body });
        if (!parsed.success) {
          return {
            ok: false as const,
            error: parsed.error.issues.map((i) => i.message).join("; "),
          };
        }
        return { ok: true as const, data: parsed.data };
      } catch {
        return { ok: false as const, error: "Invalid request body" };
      }
    },
    authorize: async () => {
      if (!sameOrigin(request)) return { ok: false as const, error: "origin" };
      try {
        const actor = await requireActor();
        return { ok: true as const, data: actor };
      } catch {
        return { ok: false as const, error: "unauthenticated" };
      }
    },
    service: async (input) => {
      return postBookingMessage(bookingId, input.message);
    },
  });

  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    if (pipeline.stage === "input_validation") {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = pipeline.data;
  if (!result.ok) {
    const status =
      result.error.code === "unauthenticated" ? 401
      : result.error.code === "not_found" ? 404
      : result.error.code === "forbidden" ? 403
      : result.error.code === "validation_failed" ? 400
      : 500;
    return NextResponse.json({ error: result.error.message }, { status });
  }

  return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
}

