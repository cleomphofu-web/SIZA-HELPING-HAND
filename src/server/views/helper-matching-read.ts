import "server-only";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { fail, ok, type Result } from "@/server/services/result";
import type { HelperGenderMatchGroup } from "@/server/services/helper-matching";

export type OwnHelperMatchingView = { enabled: boolean; genderMatchGroup: HelperGenderMatchGroup };

export async function getOwnHelperMatchingView(): Promise<Result<OwnHelperMatchingView>> {
  let actor;
  try { actor = await requireActor(); } catch { return fail("unauthenticated", "Please sign in to continue."); }
  if (actor.role !== "helper") return fail("not_found", "We could not find this profile.");
  try {
    const client = createSupabaseAdminClient();
    const [{ data, error }, { data: feature, error: featureError }] = await Promise.all([
      client.from("helper_details").select("gender_match_group").eq("user_id", actor.userId).maybeSingle(),
      client.from("app_config").select("value").eq("key", "helper_gender_matching_enabled").maybeSingle(),
    ]);
    if (error || featureError) return fail("internal_error", "We could not load this setting.");
    if (!data) return fail("not_found", "We could not find this profile.");
    const enabled = feature?.value === true;
    const group = enabled ? data.gender_match_group : null;
    if (group !== null && group !== "female" && group !== "male") return fail("internal_error", "We could not load this setting.");
    return ok({ enabled, genderMatchGroup: group });
  } catch {
    return fail("internal_error", "We could not load this setting.");
  }
}
