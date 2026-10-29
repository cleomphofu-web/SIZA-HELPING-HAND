-- Seed initial Phase A services, rate card, transport zones, and estimator configuration.
-- Forward-only migration following docs/SIZA-v2-spec.md Section 6.6.

-- Service categories
insert into public.service_categories (name, titles, enabled, requires_licence, pricing) values
  ('Home Cleaning', '{"Standard Home Clean", "Regular Domestic Cleaning"}'::text[], true, false, 'rate_card'),
  ('Deep Cleaning', '{"Deep Clean", "Spring Clean", "Move-in / Move-out"}'::text[], true, false, 'rate_card'),
  ('Airbnb Turnover', '{"Short-Stay Turnover", "Airbnb Guest Prep"}'::text[], true, false, 'rate_card'),
  ('Garden Maintenance', '{"Garden Cleanup", "Lawn Care"}'::text[], true, false, 'host_budget'),
  ('Handyman', '{"General Repairs", "Fixing & Mounting"}'::text[], true, true, 'quote')
on conflict (name) do update set
  titles = excluded.titles,
  enabled = excluded.enabled,
  requires_licence = excluded.requires_licence,
  pricing = excluded.pricing,
  updated_at = now();

-- Rate card starting suggestions:
-- Standard Clean: R100/hr (10000 cents), 30 min/bed, 20 min/bath
-- Deep Clean: R160/hr (16000 cents), 45 min/bed, 30 min/bath
-- Airbnb Turnover: R155/hr (15500 cents), 40 min/bed, 25 min/bath
insert into public.rate_card (service, hourly_cents, per_bedroom_minutes, per_bathroom_minutes, addon_minutes, size_band_minutes) values
  ('home_cleaning', 10000, 30, 20, '{"oven": 45, "fridge": 30, "windows": 60, "balcony": 30}'::jsonb, '{"studio": 120, "1_bed": 150, "2_bed": 180, "3_plus": 240}'::jsonb),
  ('deep_cleaning', 16000, 45, 30, '{"oven": 60, "fridge": 45, "windows": 90, "balcony": 45}'::jsonb, '{"studio": 180, "1_bed": 210, "2_bed": 270, "3_plus": 360}'::jsonb),
  ('airbnb_turnover', 15500, 40, 25, '{"laundry": 60, "linens": 45, "welcome_pack": 15}'::jsonb, '{"studio": 120, "1_bed": 150, "2_bed": 180, "3_plus": 240}'::jsonb)
on conflict (service) do update set
  hourly_cents = excluded.hourly_cents,
  per_bedroom_minutes = excluded.per_bedroom_minutes,
  per_bathroom_minutes = excluded.per_bathroom_minutes,
  addon_minutes = excluded.addon_minutes,
  size_band_minutes = excluded.size_band_minutes,
  updated_at = now();

-- Transport zones: Pilot suburbs in Johannesburg & Vaal with standard transport allowance
insert into public.transport_zones (suburb, region, zone, transport_cents, enabled) values
  ('Rosebank', 'johannesburg', 'JHB-North', 5000, true),
  ('Sandton', 'johannesburg', 'JHB-North', 5000, true),
  ('Parkhurst', 'johannesburg', 'JHB-North', 5000, true),
  ('Craighall', 'johannesburg', 'JHB-North', 5000, true),
  ('Melville', 'johannesburg', 'JHB-Central', 4500, true),
  ('Braamfontein', 'johannesburg', 'JHB-Central', 4500, true),
  ('Fourways', 'johannesburg', 'JHB-Outer-North', 6000, true),
  ('Midrand', 'johannesburg', 'JHB-Outer-North', 6000, true),
  ('Vanderbijlpark', 'vaal', 'VAAL-Central', 4000, true),
  ('Vereeniging', 'vaal', 'VAAL-Central', 4000, true)
on conflict (suburb) do update set
  region = excluded.region,
  zone = excluded.zone,
  transport_cents = excluded.transport_cents,
  enabled = excluded.enabled,
  updated_at = now();

-- Ensure minimum duration and floor pricing settings exist in app_config
insert into public.app_config (key, value) values
  ('min_booking_hours', '3'::jsonb),
  ('min_hourly_floor_cents', '10000'::jsonb),
  ('subscription_monthly_cents', '15000'::jsonb)
on conflict (key) do nothing;
