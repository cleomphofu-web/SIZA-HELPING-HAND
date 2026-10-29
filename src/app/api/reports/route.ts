import { NextRequest, NextResponse } from "next/server";
import { reportSchema } from "@/lib/schemas";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { assertRole } from "@/server/policies/authorization";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { createPhaseAReport } from "@/server/services/phase-a";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { sameOrigin } from "@/server/security/origin";

export async function POST(request: NextRequest) {
  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("report", request), botCheck: async () => true,
    validate: async () => {
      const payload = request.headers.get("content-type")?.includes("application/json") ? await request.json() : Object.fromEntries(await request.formData());
      const normalised = { ...payload, bookingId: payload.bookingId || null, subjectId: payload.subjectId || null };
      const parsed = reportSchema.safeParse(normalised);
      return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "invalid" };
    },
    authorize: async () => {
      if (!sameOrigin(request)) return { ok: false as const, error: "origin" };
      try { const actor = await requireActor(); assertRole(actor, actor.role); return { ok: true as const, data: actor }; } catch { return { ok: false as const, error: "forbidden" }; }
    },
    service: (input, actor) => createPhaseAReport(createSupabaseAdminClient(), actor.userId, input),
  });
  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    const forbidden = pipeline.stage === "authorization";
    return NextResponse.json({ ok: false, error: { code: forbidden ? "forbidden" : "validation_failed", message: forbidden ? "You cannot send this report." : "Tell us what happened before sending the report." } }, { status: forbidden ? 403 : 400 });
  }
  const result = pipeline.data;
  const status = result.ok ? 201 : result.error.code === "forbidden" ? 403 : result.error.code === "not_found" ? 404 : result.error.code === "validation_failed" ? 400 : 500;
  return NextResponse.json(result, { status });
}
