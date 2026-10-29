import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { UpdateRateCardInput, UpdateTransportZoneInput, UpdateAppConfigInput } from "@/server/domain/admin-settings";
import { ok, fail } from "@/server/services/result";

export async function updateRateCard(client: SupabaseClient, input: UpdateRateCardInput) {
  const { error } = await client
    .from("rate_card")
    .update({
      hourly_cents: input.hourly_cents,
      per_bedroom_minutes: input.per_bedroom_minutes,
      per_bathroom_minutes: input.per_bathroom_minutes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (error) return fail("internal_error", "Could not update rate card.");
  return ok({ id: input.id });
}

export async function updateTransportZone(client: SupabaseClient, input: UpdateTransportZoneInput) {
  const { error } = await client
    .from("transport_zones")
    .update({
      transport_cents: input.transport_cents,
      enabled: input.enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("suburb", input.suburb);

  if (error) return fail("internal_error", "Could not update transport zone.");
  return ok({ suburb: input.suburb });
}

export async function updateAppConfig(client: SupabaseClient, input: UpdateAppConfigInput) {
  const { error } = await client
    .from("app_config")
    .upsert({ key: input.key, value: input.value, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) return fail("internal_error", "Could not update configuration.");
  return ok({ key: input.key });
}

