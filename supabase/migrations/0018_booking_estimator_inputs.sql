-- Persist the configuration snapshot needed to explain the server-calculated booking estimate.
-- Existing requests remain valid with NULL estimator snapshots; all new application writes provide them.
-- 0001_init.sql is applied and immutable. This migration is forward-only.

alter table public.rate_card
  add column size_band_minutes jsonb not null default '{}'::jsonb,
  add constraint rate_card_size_band_minutes_object
    check (jsonb_typeof(size_band_minutes) = 'object');

alter table public.phase_a_bookings
  add column estimated_minutes integer,
  add column estimate_inputs jsonb,
  add column gender_pref text not null default 'any',
  add constraint phase_a_bookings_estimated_minutes_range
    check (estimated_minutes is null or estimated_minutes between 1 and 1440),
  add constraint phase_a_bookings_estimate_inputs_object
    check (estimate_inputs is null or jsonb_typeof(estimate_inputs) = 'object'),
  add constraint phase_a_bookings_gender_pref_allowed
    check (gender_pref in ('any', 'female', 'male', 'mix'));

insert into public.app_config (key, value)
values ('floor_percent', '100'::jsonb)
on conflict (key) do nothing;
