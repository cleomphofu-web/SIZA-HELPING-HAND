import "server-only";

import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { fail, ok, type Result } from "@/server/services/result";
import { viewHostProfileForActor, type HostProfileView } from "@/server/views/host-profile";

export async function getOwnHostProfileView(): Promise<Result<HostProfileView>> {
  let actor;
  try {
    actor = await requireActor();
  } catch {
    return fail("unauthenticated", "Please sign in to continue.");
  }
  if (actor.role !== "host") return fail("not_found", "We could not find this profile.");

  try {
    const { data, error } = await createSupabaseAdminClient().from("host_details")
      .select("user_id, address_line, suburb, city, notes_default")
      .eq("user_id", actor.userId)
      .maybeSingle();
    if (error) return fail("internal_error", "We could not load your profile.");
    const view = viewHostProfileForActor(data ? {
      userId: data.user_id,
      addressLine: data.address_line,
      suburb: data.suburb,
      city: data.city,
      notesDefault: data.notes_default,
    } : null, actor);
    return view ? ok(view) : fail("not_found", "We could not find this profile.");
  } catch {
    return fail("internal_error", "We could not load your profile.");
  }
}
