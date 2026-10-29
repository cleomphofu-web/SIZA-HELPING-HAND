import { z } from "zod";

// ── Rate Card ────────────────────────────────────────────────────────────────
export type RateCardRow = {
  id: string;
  service: string;
  hourly_cents: number;
  per_bedroom_minutes: number;
  per_bathroom_minutes: number;
  addon_minutes: Record<string, number>;
  size_band_minutes: Record<string, number>;
  updated_at: string;
};

export const UpdateRateCardSchema = z.object({
  id: z.string().uuid(),
  hourly_cents: z.coerce.number().int().nonnegative().max(1_000_000),
  per_bedroom_minutes: z.coerce.number().int().nonnegative().max(480),
  per_bathroom_minutes: z.coerce.number().int().nonnegative().max(480),
}).strict();
export type UpdateRateCardInput = z.infer<typeof UpdateRateCardSchema>;

// ── Transport Zone ───────────────────────────────────────────────────────────
export type TransportZoneRow = {
  suburb: string;
  region: "johannesburg" | "vaal";
  zone: string;
  transport_cents: number;
  enabled: boolean;
  updated_at: string;
};

export const UpdateTransportZoneSchema = z.object({
  suburb: z.string().min(1).max(80),
  transport_cents: z.coerce.number().int().nonnegative().max(1_000_000),
  enabled: z.preprocess((val) => val === "true" || val === true, z.boolean()),
}).strict();
export type UpdateTransportZoneInput = z.infer<typeof UpdateTransportZoneSchema>;

// ── App Config ───────────────────────────────────────────────────────────────
// Only numeric integer keys are exposed for admin edit.
export const EDITABLE_CONFIG_KEYS = [
  "offer_window_minutes",
  "no_show_minutes",
  "check_in_lock_minutes",
  "id_doc_retention_days",
  "check_in_expiry_hours",
  "confirm_grace_hours",
  "auto_release_hours",
] as const;
export type EditableConfigKey = typeof EDITABLE_CONFIG_KEYS[number];

export const UpdateAppConfigSchema = z.object({
  key: z.enum(EDITABLE_CONFIG_KEYS),
  value: z.coerce.number().int().positive().max(8760), // max 1 year in hours
}).strict();
export type UpdateAppConfigInput = z.infer<typeof UpdateAppConfigSchema>;

