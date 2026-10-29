import "server-only";

import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/server/db/server";
import { limit } from "@/server/security/ratelimit";

export async function limitAdminAction() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-real-ip") ?? requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return limit("admin_action", user?.id ?? ip);
}

/** MFA codes are short and sensitive; use a separate account-keyed attempt bucket. */
export async function limitAdminMfaVerification() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-real-ip") ?? requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return limit("mfa_verify", user?.id ?? ip);
}
