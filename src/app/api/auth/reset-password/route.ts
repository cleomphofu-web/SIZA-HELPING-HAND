import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/server/db/server";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { sameOrigin } from "@/server/security/origin";

const requestResetSchema = z.object({
  email: z.string().email(),
  action: z.literal("request"),
});

const updatePasswordSchema = z.object({
  password: z.string().min(8),
  action: z.literal("update"),
});

const resetPasswordSchema = z.union([requestResetSchema, updatePasswordSchema]);

export async function POST(request: NextRequest) {
  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("login", request),
    botCheck: async () => true,
    validate: async () => {
      try {
        const json = await request.json();
        const parsed = resetPasswordSchema.safeParse(json);
        return parsed.success
          ? { ok: true as const, data: parsed.data }
          : { ok: false as const, error: "invalid" };
      } catch {
        return { ok: false as const, error: "invalid" };
      }
    },
    authorize: async () =>
      sameOrigin(request)
        ? { ok: true as const, data: null }
        : { ok: false as const, error: "origin" },
    service: async (input) => {
      const supabase = await createSupabaseServerClient();
      if (input.action === "request") {
        const origin = request.nextUrl.origin;
        await supabase.auth.resetPasswordForEmail(input.email, {
          redirectTo: `${origin}/reset-password`,
        });
        return { ok: true };
      }

      if (input.action === "update") {
        const { error } = await supabase.auth.updateUser({
          password: input.password,
        });
        if (error) {
          return { ok: false, error: error.message };
        }
        return { ok: true };
      }

      return { ok: false, error: "Invalid action" };
    },
  });

  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    return NextResponse.json({ error: "Validation or origin failure" }, { status: 400 });
  }

  const result = pipeline.data;
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
