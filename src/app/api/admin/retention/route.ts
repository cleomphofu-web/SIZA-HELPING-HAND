import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireAdmin } from "@/server/policies/auth";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { pruneExpiredRateLimitCounters, purgeExpiredHelperDocuments } from "@/server/services/retention";
import { sameOrigin } from "@/server/security/origin";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";

export async function POST(request: NextRequest) {
  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("admin_action", request), botCheck: async () => true,
    validate: async () => ({ ok: true as const, data: undefined }),
    authorize: async () => {
      if (!sameOrigin(request)) return { ok: false as const, error: "origin" };
      try { return { ok: true as const, data: await requireAdmin() }; }
      catch { return { ok: false as const, error: "forbidden" }; }
    },
    service: async () => {
      try {
        const client = createSupabaseAdminClient();
        const documents = await purgeExpiredHelperDocuments(client);
        const rateLimitCountersPruned = await pruneExpiredRateLimitCounters(client);
        return { ok: true as const, data: { ...documents, rateLimitCountersPruned } };
      }
      catch { return { ok: false as const, error: { code: "internal_error", message: "We could not complete document retention." } }; }
    },
  });
  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    if (pipeline.stage === "authorization") return NextResponse.json({ ok: false, error: { code: "forbidden", message: "This request was not accepted." } }, { status: 403 });
    return NextResponse.json({ ok: false, error: { code: "validation_failed", message: "This request was not accepted." } }, { status: 400 });
  }
  return NextResponse.json(pipeline.data, { status: pipeline.data.ok ? 200 : 500 });
}
