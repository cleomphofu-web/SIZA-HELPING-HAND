import { NextRequest, NextResponse } from "next/server";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { createSupabaseServerClient } from "@/server/db/server";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { accountDestinationForRole } from "@/lib/account-destination";

export async function GET(request: NextRequest) {
  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("login", request),
    botCheck: async () => true,
    validate: async () => ({ ok: true as const, data: null }),
    authorize: async () => ({ ok: true as const, data: null }),
    service: async () => {
      const { searchParams, origin } = new URL(request.url);
      const code = searchParams.get("code");
      const roleParam = searchParams.get("role") || "host";

      if (!code) {
        return { destination: `${origin}/login?error=missing_code` };
      }

      try {
        const supabase = await createSupabaseServerClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          return { destination: `${origin}/login?error=auth_exchange_failed` };
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          return { destination: `${origin}/login?error=no_user` };
        }

        const adminClient = createSupabaseAdminClient();
        const { data: profile } = await adminClient
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          const fullName =
            user.user_metadata?.full_name || user.user_metadata?.name || "User";
          const parts = String(fullName).trim().split(" ");
          const firstName = parts[0] || "User";
          const lastName = parts.slice(1).join(" ") || "Account";
          const assignedRole = roleParam === "helper" ? "helper" : "host";

          const now = new Date().toISOString();
          const randomSuffix = Math.floor(10000000 + Math.random() * 90000000);
          const validPhone =
            user.phone && /^\+27[6-8][0-9]{8}$/.test(user.phone)
              ? user.phone
              : `+277${randomSuffix}`;

          await adminClient.from("profiles").insert({
            id: user.id,
            role: assignedRole,
            first_name: firstName.slice(0, 80),
            last_name: lastName.slice(0, 120),
            phone: validPhone,
            terms_version: "2026-10-26",
            terms_accepted_at: now,
            privacy_version: "2026-10-26",
            privacy_accepted_at: now,
          });

          if (assignedRole === "helper") {
            await adminClient.from("helper_details").insert({
              user_id: user.id,
              status: "pending",
              suburbs: [],
              services: ["home_cleaning"],
              job_title: "Helper",
              date_of_birth: "1990-01-01",
            });
          } else {
            await adminClient.from("host_details").insert({
              user_id: user.id,
              address_line: "Address pending update",
              suburb: "Sandton",
              city: "Johannesburg",
            });
          }

          const destination = accountDestinationForRole(assignedRole);
          return { destination: `${origin}${destination}` };
        }

        const destination = accountDestinationForRole(profile.role);
        return { destination: `${origin}${destination}` };
      } catch {
        return { destination: `${origin}/login?error=callback_error` };
      }
    },
  });

  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", request.url));
  }

  return NextResponse.redirect(pipeline.data.destination);
}
