import { NextRequest, NextResponse } from "next/server";
import { helperGenderMatchPreferenceSchema } from "@/lib/schemas";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { assertRole } from "@/server/policies/authorization";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { sameOrigin } from "@/server/security/origin";
import { isHelperGenderMatchingEnabled, saveHelperGenderMatchingPreference } from "@/server/services/helper-matching";
import { fail } from "@/server/services/result";
import { t } from "@/content/t";

function isJson(request: NextRequest) { return request.headers.get("content-type")?.includes("application/json") ?? false; }

export async function POST(request: NextRequest) {
  const json = isJson(request);
  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("apply", request),
    botCheck: async () => true,
    validate: async () => {
      const raw = json ? await request.json() : Object.fromEntries(await request.formData());
      const payload = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
      const normalized = json ? payload : { ...payload, consent: payload.consent === "on" };
      const parsed = helperGenderMatchPreferenceSchema.safeParse(normalized);
      return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "invalid" };
    },
    authorize: async () => {
      if (!sameOrigin(request)) return { ok: false as const, error: "origin" };
      try {
        const actor = await requireActor();
        assertRole(actor, "helper");
        return { ok: true as const, data: actor };
      } catch {
        return { ok: false as const, error: "forbidden" };
      }
    },
    service: async (input, actor) => {
      const client = createSupabaseAdminClient();
      const matchingEnabled = await isHelperGenderMatchingEnabled(client);
      if (matchingEnabled === null) return fail("internal_error", t("helper.matching.failed"));
      if (!matchingEnabled) return fail("conflict", t("helper.matching.unavailable"));
      return saveHelperGenderMatchingPreference(client, actor.userId, input.genderMatchGroup === "none" ? null : input.genderMatchGroup);
    },
  });

  if (!pipeline.ok) {
    if (!json && pipeline.stage === "rate_limit") return NextResponse.redirect(new URL("/helper/profile?matching=rate_limited", request.url), 303);
    if (!json && pipeline.stage === "input_validation") return NextResponse.redirect(new URL("/helper/profile?matching=failed", request.url), 303);
    if (!json && pipeline.stage === "authorization") return NextResponse.redirect(new URL("/login", request.url), 303);
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    const forbidden = pipeline.stage === "authorization";
    return NextResponse.json({ ok: false, error: { code: forbidden ? "forbidden" : "validation_failed", message: forbidden ? "Only helpers can change this setting." : "Choose a valid preference and try again." } }, { status: forbidden ? 403 : 400 });
  }

  if (!pipeline.data.ok && pipeline.data.error.code === "conflict") {
    if (!json) return NextResponse.redirect(new URL("/helper/profile?matching=unavailable", request.url), 303);
    return NextResponse.json(pipeline.data, { status: 409 });
  }
  if (!json) return NextResponse.redirect(new URL(`/helper/profile?matching=${pipeline.data.ok ? "saved" : "failed"}`, request.url), 303);
  if (pipeline.data.ok) return NextResponse.json(pipeline.data);
  return NextResponse.json(pipeline.data, { status: 500 });
}
