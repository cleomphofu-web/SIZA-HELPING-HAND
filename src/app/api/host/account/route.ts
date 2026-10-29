import { NextRequest, NextResponse } from "next/server";
import { hostAccountSchema } from "@/lib/schemas";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { assertRole } from "@/server/policies/authorization";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { saveHostAccountDetails } from "@/server/services/phase-a";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { sameOrigin } from "@/server/security/origin";

function isJson(request: NextRequest) { return request.headers.get("content-type")?.includes("application/json") ?? false; }
function formRedirect(request: NextRequest, account: "saved" | "failed" | "rate_limited") {
  return NextResponse.redirect(new URL(`/app/profile?account=${account}`, request.url), 303);
}

export async function POST(request: NextRequest) {
  const json = isJson(request);
  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("booking", request),
    botCheck: async () => true,
    validate: async () => {
      const payload = json ? await request.json() : Object.fromEntries(await request.formData());
      const parsed = hostAccountSchema.safeParse(payload);
      return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "invalid" };
    },
    authorize: async () => {
      if (!sameOrigin(request)) return { ok: false as const, error: "origin" };
      try {
        const actor = await requireActor();
        assertRole(actor, "host");
        return { ok: true as const, data: actor };
      } catch {
        return { ok: false as const, error: "forbidden" };
      }
    },
    service: (input, actor) => saveHostAccountDetails(createSupabaseAdminClient(), actor.userId, input),
  });

  if (!pipeline.ok) {
    if (!json && pipeline.stage === "rate_limit") return formRedirect(request, "rate_limited");
    if (!json && pipeline.stage === "input_validation") return formRedirect(request, "failed");
    if (!json && pipeline.stage === "authorization") return NextResponse.redirect(new URL("/", request.url), 303);
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    const forbidden = pipeline.stage === "authorization";
    return NextResponse.json({ ok: false, error: { code: forbidden ? "forbidden" : "validation_failed", message: forbidden ? "Only hosts can save these details." : "Check the details and try again." } }, { status: forbidden ? 403 : 400 });
  }

  const result = pipeline.data;
  if (!json) return formRedirect(request, result.ok ? "saved" : "failed");
  if (result.ok) return NextResponse.json(result, { status: 200 });
  const status = result.error.code === "conflict" ? 409 : result.error.code === "not_found" ? 404 : 500;
  return NextResponse.json(result, { status });
}
