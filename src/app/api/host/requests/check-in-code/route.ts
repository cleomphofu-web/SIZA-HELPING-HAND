import { NextRequest, NextResponse } from "next/server";
import { checkInCodeRequestSchema } from "@/lib/schemas";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { assertRole } from "@/server/policies/authorization";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { issuePhaseACheckInCode } from "@/server/services/phase-a";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { sameOrigin } from "@/server/security/origin";

export async function POST(request: NextRequest) {
  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("booking", request), botCheck: async () => true,
    validate: async () => {
      const payload = request.headers.get("content-type")?.includes("application/json") ? await request.json() : Object.fromEntries(await request.formData());
      const parsed = checkInCodeRequestSchema.safeParse(payload);
      return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "invalid" };
    },
    authorize: async () => {
      if (!sameOrigin(request)) return { ok: false as const, error: "origin" };
      try { const actor = await requireActor(); assertRole(actor, "host"); return { ok: true as const, data: actor }; } catch { return { ok: false as const, error: "forbidden" }; }
    },
    service: (input, actor) => issuePhaseACheckInCode(createSupabaseAdminClient(), actor.userId, input),
  });
  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    const forbidden = pipeline.stage === "authorization";
    return NextResponse.json({ ok: false, error: { code: forbidden ? "forbidden" : "validation_failed", message: forbidden ? "Only hosts can issue this code." : "That request reference is not valid." } }, { status: forbidden ? 403 : 400 });
  }
  const result = pipeline.data;
  return NextResponse.json(result, { status: result.ok ? 200 : result.error.code === "not_found" ? 404 : 500 });
}
