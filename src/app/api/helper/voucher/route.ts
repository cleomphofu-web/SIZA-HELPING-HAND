import { NextRequest, NextResponse } from "next/server";
import { HelperVoucherSubmissionSchema } from "@/server/domain/voucher-subscription";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { submitHelperVoucher } from "@/server/services/phase-a";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { sameOrigin } from "@/server/security/origin";

export async function POST(request: NextRequest) {
  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("booking", request),
    botCheck: async () => true,
    validate: async () => {
      const payload = request.headers.get("content-type")?.includes("application/json")
        ? await request.json()
        : Object.fromEntries(await request.formData());
      const parsed = HelperVoucherSubmissionSchema.safeParse(payload);
      return parsed.success
        ? { ok: true as const, data: parsed.data }
        : { ok: false as const, error: "invalid" };
    },
    authorize: async () => {
      if (!sameOrigin(request)) return { ok: false as const, error: "origin" };
      try {
        const actor = await requireActor();
        if (actor.role !== "helper") return { ok: false as const, error: "forbidden" };
        return { ok: true as const, data: actor };
      } catch {
        return { ok: false as const, error: "forbidden" };
      }
    },
    service: async (input, actor) => ({
      result: await submitHelperVoucher(createSupabaseAdminClient(), actor.userId, input),
    }),
  });

  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    const forbidden = pipeline.stage === "authorization";
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: forbidden ? "forbidden" : "validation_failed",
          message: forbidden ? "Only helpers may submit vouchers." : "Please check your voucher details.",
        },
      },
      { status: forbidden ? 403 : 400 },
    );
  }

  const { result } = pipeline.data;
  if (!result.ok) {
    const status =
      result.error.code === "not_found" ? 404
      : result.error.code === "forbidden" ? 403
      : 500;
    return NextResponse.json(result, { status });
  }

  const referer = request.headers.get("referer");
  if (!request.headers.get("content-type")?.includes("application/json") && referer) {
    return NextResponse.redirect(new URL(referer), 303);
  }

  return NextResponse.json(result, { status: 200 });
}

