-- 20261110000000_enable_gardening_service.sql
-- Enable garden maintenance service, rate card entries, and helper services.

insert into public.service_categories (name, titles, enabled, requires_licence, pricing) values
  ('garden', '{"Garden Maintenance", "Garden Cleanup", "Lawn Care"}'::text[], true, false, 'rate_card'),
  ('gardening', '{"Garden Maintenance", "Garden Cleanup", "Lawn Care"}'::text[], true, false, 'rate_card')
on conflict (name) do update set
  titles = excluded.titles,
  enabled = excluded.enabled,
  requires_licence = excluded.requires_licence,
  pricing = excluded.pricing,
  updated_at = now();

insert into public.rate_card (service, hourly_cents, per_bedroom_minutes, per_bathroom_minutes, addon_minutes, size_band_minutes) values
  ('garden', 11000, 0, 0, '{"lawn_mowing": 60, "weeding": 60, "hedge_trimming": 45, "green_waste_removal": 30}'::jsonb, '{"small": 180, "medium": 240, "large": 360}'::jsonb),
  ('gardening', 11000, 0, 0, '{"lawn_mowing": 60, "weeding": 60, "hedge_trimming": 45, "green_waste_removal": 30}'::jsonb, '{"small": 180, "medium": 240, "large": 360}'::jsonb)
on conflict (service) do update set
  hourly_cents = excluded.hourly_cents,
  per_bedroom_minutes = excluded.per_bedroom_minutes,
  per_bathroom_minutes = excluded.per_bathroom_minutes,
  addon_minutes = excluded.addon_minutes,
  size_band_minutes = excluded.size_band_minutes,
  updated_at = now();

