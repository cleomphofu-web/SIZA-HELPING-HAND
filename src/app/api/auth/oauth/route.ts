import { NextRequest, NextResponse } from "next/server";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { createSupabaseServerClient } from "@/server/db/server";
import { resolveCanonicalSiteOrigin } from "@/server/security/origin";

export async function GET(request: NextRequest) {
  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("login", request),
    botCheck: async () => true,
    validate: async () => ({ ok: true as const, data: null }),
    authorize: async () => ({ ok: true as const, data: null }),
    service: async () => {
      // REMOVED: old Host-header derived origin
      const siteOrigin = resolveCanonicalSiteOrigin(request);
      const { searchParams } = new URL(request.url);
      const provider = searchParams.get("provider") || "google";
      const role = searchParams.get("role") || "host";
      if (provider !== "google") {
        return { url: `${siteOrigin}/login?error=unsupported_provider` };
      }
      try {
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${siteOrigin}/api/auth/callback?role=${encodeURIComponent(role)}`,
          },
        });
        if (error || !data?.url) {
          return { url: `${siteOrigin}/login?error=oauth_unavailable` };
        }
        return { url: data.url };
      } catch {
        return { url: `${siteOrigin}/login?error=oauth_error` };
      }
    },
  });

  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") === "helper" ? "helper" : "host";
  const response = NextResponse.redirect(pipeline.data.url);
  response.cookies.set("siza_oauth_role", role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
