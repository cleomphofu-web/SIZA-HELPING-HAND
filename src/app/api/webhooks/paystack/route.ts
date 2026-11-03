import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { processPaymentWebhook } from "@/server/services/payment-webhook";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("admin_action", request),
    botCheck: async () => true,
    validate: async () => ({ ok: true as const, data: rawBody }),
    authorize: async () => ({ ok: true as const, data: null }),
    service: async () => {
      const adminDb = createSupabaseAdminClient();
      return processPaymentWebhook(adminDb, rawBody, request.headers);
    },
  });

  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    return NextResponse.json({ error: "Webhook rejected" }, { status: 400 });
  }

  const result = pipeline.data;
  if (!result.ok) {
    if (result.error.code === "validation_failed") {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    if (result.error.code === "conflict") {
      return NextResponse.json({ error: result.error.message }, { status: 409 });
    }
    if (result.error.code === "not_found") {
      return NextResponse.json({ error: result.error.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
