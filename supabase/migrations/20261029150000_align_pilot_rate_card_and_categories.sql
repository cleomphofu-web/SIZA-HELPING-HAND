-- Forward-only migration aligning rate_card size band keys and service_categories for all pilot suburbs
-- Fixes host booking form dropdown availability

insert into public.service_categories (name, titles, enabled, requires_licence, pricing) values
  ('home', '{"Standard Home Clean", "Regular Domestic Cleaning"}'::text[], true, false, 'rate_card'),
  ('home_cleaning', '{"Standard Home Clean", "Regular Domestic Cleaning"}'::text[], true, false, 'rate_card'),
  ('deep_cleaning', '{"Deep Clean", "Spring Clean", "Move-in / Move-out"}'::text[], true, false, 'rate_card'),
  ('airbnb_turnover', '{"Short-Stay Turnover", "Airbnb Guest Prep"}'::text[], true, false, 'rate_card')
on conflict (name) do update set
  titles = excluded.titles,
  enabled = excluded.enabled,
  pricing = excluded.pricing,
  updated_at = now();

insert into public.rate_card (service, hourly_cents, per_bedroom_minutes, per_bathroom_minutes, addon_minutes, size_band_minutes) values
  ('home', 10000, 30, 20, '{"oven": 45, "fridge": 30, "windows": 60, "balcony": 30, "laundry": 45, "ironing": 30}'::jsonb, '{"small": 120, "medium": 180, "large": 240}'::jsonb),
  ('home_cleaning', 10000, 30, 20, '{"oven": 45, "fridge": 30, "windows": 60, "balcony": 30, "laundry": 45, "ironing": 30}'::jsonb, '{"small": 120, "medium": 180, "large": 240}'::jsonb),
  ('deep_cleaning', 16000, 45, 30, '{"oven": 60, "fridge": 45, "windows": 90, "balcony": 45}'::jsonb, '{"small": 180, "medium": 270, "large": 360}'::jsonb),
  ('airbnb_turnover', 15500, 40, 25, '{"laundry": 60, "linens": 45, "welcome_pack": 15}'::jsonb, '{"small": 120, "medium": 180, "large": 240}'::jsonb)
on conflict (service) do update set
  hourly_cents = excluded.hourly_cents,
  per_bedroom_minutes = excluded.per_bedroom_minutes,
  per_bathroom_minutes = excluded.per_bathroom_minutes,
  addon_minutes = excluded.addon_minutes,
  size_band_minutes = excluded.size_band_minutes,
  updated_at = now();

