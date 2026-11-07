import { NextRequest, NextResponse } from "next/server";
import { HelperYocoSubmissionSchema } from "@/server/domain/yoco-subscription";
import { requireActor } from "@/server/policies/auth";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { submitHelperYocoPayment } from "@/server/services/yoco-subscription";
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
      const parsed = HelperYocoSubmissionSchema.safeParse(payload);
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
    service: async (input) => submitHelperYocoPayment(input),
  });

  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    const forbidden = pipeline.stage === "authorization";
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: forbidden ? "forbidden" : "validation_failed",
          message: forbidden ? "Only helpers may submit subscription payments." : "Please enter a valid payment reference.",
        },
      },
      { status: forbidden ? 403 : 400 },
    );
  }

  const result = pipeline.data;
  if (!result.ok) {
    const status =
      result.error.code === "not_found" ? 404
      : result.error.code === "forbidden" ? 403
      : result.error.code === "conflict" ? 409
      : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result, { status: 200 });
}

