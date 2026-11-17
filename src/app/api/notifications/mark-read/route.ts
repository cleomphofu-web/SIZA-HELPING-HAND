import { NextRequest, NextResponse } from "next/server";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { requireActor } from "@/server/policies/auth";
import { markAllNotificationsRead } from "@/server/services/notifications";

// POST /api/notifications/mark-read
// Marks all unread notifications for the signed-in user as read.
export async function POST(request: NextRequest) {
  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("notification", request),
    botCheck: async () => true,
    validate: async () => ({ ok: true as const, data: null }),
    authorize: async () => {
      try {
        const actor = await requireActor();
        return { ok: true as const, data: actor };
      } catch {
        return { ok: false as const, error: "unauthenticated" };
      }
    },
    service: async () => {
      return markAllNotificationsRead();
    },
  });

  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = pipeline.data;
  if (!result.ok) {
    const status = result.error.code === "unauthenticated" ? 401 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result.data);
}
