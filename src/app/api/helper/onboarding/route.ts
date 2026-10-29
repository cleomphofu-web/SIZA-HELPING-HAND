import { NextRequest, NextResponse } from "next/server";
import { helperProfileSchema } from "@/lib/schemas";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { assertRole } from "@/server/policies/authorization";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { saveHelperProfile } from "@/server/services/phase-a";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { sameOrigin } from "@/server/security/origin";

function text(form: FormData, key: string) { return String(form.get(key) ?? ""); }

export async function POST(request: NextRequest) {
  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("upload", request), botCheck: async () => true,
    validate: async () => {
      const form = await request.formData();
      const parsed = helperProfileSchema.safeParse({
        dateOfBirth: text(form, "dateOfBirth"),
        jobTitle: text(form, "jobTitle"),
        services: text(form, "services").split(",").map((item) => item.trim()).filter(Boolean),
        suburbs: text(form, "suburbs").split(",").map((item) => item.trim()).filter(Boolean),
        bio: text(form, "bio"),
        experienceNote: text(form, "experienceNote"),
        rateNote: text(form, "rateNote"),
        idNumber: text(form, "idNumber"),
        referenceName: text(form, "referenceName") || undefined,
        referencePhone: text(form, "referencePhone") || undefined,
        consent: form.get("consent") === "on",
      });
      if (!parsed.success) return { ok: false as const, error: "invalid" };
      const idPhoto = form.get("idPhoto"); const selfieCheck = form.get("selfieCheck");
      if (!(idPhoto instanceof File) || !(selfieCheck instanceof File) || idPhoto.size === 0 || selfieCheck.size === 0) return { ok: false as const, error: "missing_documents" };
      return { ok: true as const, data: { profile: parsed.data, idPhoto, selfieCheck } };
    },
    authorize: async () => {
      if (!sameOrigin(request)) return { ok: false as const, error: "origin" };
      try { const actor = await requireActor(); assertRole(actor, "helper"); return { ok: true as const, data: actor }; } catch { return { ok: false as const, error: "forbidden" }; }
    },
    service: (input, actor) => saveHelperProfile(createSupabaseAdminClient(), actor.userId, input.profile, { idPhoto: input.idPhoto, selfieCheck: input.selfieCheck }),
  });
  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    const forbidden = pipeline.stage === "authorization";
    const missingDocs = pipeline.stage === "input_validation" && pipeline.error === "missing_documents";
    return NextResponse.json({ ok: false, error: { code: forbidden ? "forbidden" : "validation_failed", message: forbidden ? "Only helpers can save this profile." : missingDocs ? "Add both required documents." : "Check the highlighted details." } }, { status: forbidden ? 403 : 400 });
  }
  const result = pipeline.data;
  if (result.ok) {
    if (!request.headers.get("content-type")?.includes("application/json")) return NextResponse.redirect(new URL("/helper", request.url), 303);
    return NextResponse.json(result, { status: 200 });
  }
  return NextResponse.json(result, { status: result.error.code === "conflict" ? 409 : 500 });
}
