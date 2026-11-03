import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { assertRole } from "@/server/policies/authorization";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { sameOrigin } from "@/server/security/origin";
import { submitHelperKyc } from "@/server/services/kyc";

const kycSchema = z.object({
  idNumber: z.string().regex(/^\d{13}$/, "ID number must be 13 digits"),
  consentText: z.string().min(10),
  consentVersion: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("apply", request),
    botCheck: async () => true,
    validate: async () => {
      try {
        const body = await request.json();
        const parsed = kycSchema.safeParse(body);
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
        assertRole(actor, "helper");
        return { ok: true as const, data: actor };
      } catch {
        return { ok: false as const, error: "forbidden" };
      }
    },
    service: async (input, actor) => {
      const adminDb = createSupabaseAdminClient();
      const secretPepper = process.env.ID_ENCRYPTION_KEY || "default-secret-pepper-for-hash";
      return submitHelperKyc(
        adminDb,
        {
          helperId: actor.userId,
          idNumber: input.idNumber,
          consentText: input.consentText,
          consentVersion: input.consentVersion,
        },
        secretPepper,
      );
    },
  });

  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    const forbidden = pipeline.stage === "authorization";
    return NextResponse.json(
      { error: forbidden ? "Forbidden" : "Validation failed" },
      { status: forbidden ? 403 : 400 },
    );
  }

  const result = pipeline.data;
  if (!result.ok) {
    if (result.error.code === "conflict") {
      return NextResponse.json({ error: result.error.message }, { status: 409 });
    }
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json(result.data, { status: 200 });
}
