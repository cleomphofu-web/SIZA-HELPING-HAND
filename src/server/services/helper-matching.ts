import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fail, ok, type Result } from "@/server/services/result";

export const GENDER_MATCH_CONSENT_VERSION = "gender_matching_v1" as const;
export type HelperGenderMatchGroup = "female" | "male" | null;

export async function isHelperGenderMatchingEnabled(client: SupabaseClient): Promise<boolean | null> {
  try {
    const { data, error } = await client.from("app_config").select("value").eq("key", "helper_gender_matching_enabled").maybeSingle();
    return error ? null : data?.value === true;
  } catch {
    return null;
  }
}

export async function saveHelperGenderMatchingPreference(
  client: SupabaseClient,
  helperId: string,
  group: HelperGenderMatchGroup,
): Promise<Result<{ saved: true }>> {
  try {
    const { error } = await client.rpc("set_helper_gender_match_preference", {
      p_helper_id: helperId,
      p_gender_match_group: group,
      p_consent_version: group ? GENDER_MATCH_CONSENT_VERSION : null,
    });
    if (error) return fail("internal_error", "We could not save this preference. Try again in a minute.");
    return ok({ saved: true });
  } catch {
    return fail("internal_error", "We could not save this preference. Try again in a minute.");
  }
}
