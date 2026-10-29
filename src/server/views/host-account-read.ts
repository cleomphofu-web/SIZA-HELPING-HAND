import "server-only";

import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { fail, ok, type Result } from "@/server/services/result";
import { viewHostAccountForActor, type HostAccountView } from "@/server/views/host-account";

export async function getOwnHostAccountView(): Promise<Result<HostAccountView>> {
  let actor;
  try {
    actor = await requireActor();
  } catch {
    return fail("unauthenticated", "Please sign in to continue.");
  }
  if (actor.role !== "host") return fail("not_found", "We could not find this profile.");

  try {
    const { data, error } = await createSupabaseAdminClient().from("profiles")
      .select("id, first_name, last_name, phone")
      .eq("id", actor.userId)
      .eq("role", "host")
      .maybeSingle();
    if (error) return fail("internal_error", "We could not load your contact details.");
    const view = viewHostAccountForActor(data ? {
      userId: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
    } : null, actor);
    return view ? ok(view) : fail("not_found", "We could not find this profile.");
  } catch {
    return fail("internal_error", "We could not load your contact details.");
  }
}
