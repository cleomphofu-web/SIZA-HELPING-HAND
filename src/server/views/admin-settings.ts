import "server-only";

import { createSupabaseAdminClient } from "@/server/db/admin";
import { EDITABLE_CONFIG_KEYS, type EditableConfigKey, type RateCardRow, type TransportZoneRow } from "@/server/domain/admin-settings";
import { fail, ok } from "@/server/services/result";

export type AdminSettingsView = {
  rateCard: RateCardRow[];
  transportZones: TransportZoneRow[];
  appConfig: Record<EditableConfigKey, number>;
};

export async function getAdminSettings() {
  const client = createSupabaseAdminClient();

  const [rateCardResult, zonesResult, configResult] = await Promise.all([
    client.from("rate_card").select("id, service, hourly_cents, per_bedroom_minutes, per_bathroom_minutes, addon_minutes, size_band_minutes, updated_at").order("service"),
    client.from("transport_zones").select("suburb, region, zone, transport_cents, enabled, updated_at").order("region").order("suburb"),
    client.from("app_config").select("key, value").in("key", [...EDITABLE_CONFIG_KEYS]),
  ]);

  if (rateCardResult.error || zonesResult.error || configResult.error) {
    return fail("internal_error", "Could not load settings.");
  }

  // Build typed config map; unknown keys are ignored, unknown types default to 0.
  const appConfig = {} as Record<EditableConfigKey, number>;
  for (const key of EDITABLE_CONFIG_KEYS) {
    const row = configResult.data?.find((r) => r.key === key);
    const val = row?.value;
    appConfig[key] = typeof val === "number" && Number.isFinite(val) ? Math.round(val) : 0;
  }

  return ok({
    rateCard: (rateCardResult.data ?? []) as RateCardRow[],
    transportZones: (zonesResult.data ?? []) as TransportZoneRow[],
    appConfig,
  });
}

