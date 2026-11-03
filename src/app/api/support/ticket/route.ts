import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { sameOrigin } from "@/server/security/origin";
import { createSupportTicket } from "@/server/services/support";

const ticketSchema = z.object({
  category: z.enum(["payment", "booking", "helper_issue", "account", "other"]),
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(5000),
});

export async function POST(request: NextRequest) {
  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("report", request),
    botCheck: async () => true,
    validate: async () => {
      try {
        const body = await request.json();
        const parsed = ticketSchema.safeParse(body);
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
      return createSupportTicket(adminDb, {
        userId: actor.userId,
        category: input.category,
        subject: input.subject,
        message: input.message,
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
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ ticketId: result.data.ticketId }, { status: 201 });
}
