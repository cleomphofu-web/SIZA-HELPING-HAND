-- Seed pilot helpers and booking form configuration so the host booking form
-- shows suburbs immediately, without waiting for real approved helpers.
-- Uses fixed UUIDs so the migration is idempotent and safe to re-run.
-- All helpers start with status = 'approved', first_job_completed_at = null
-- (subscription gate not yet triggered), covering every pilot suburb.
--
-- booking_form_min_helpers controls how many eligible helpers per suburb are
-- required before the suburb appears in the booking form. Default 1 (pilot).
-- Raise to 3 in app_config once you have enough real approved helpers.

-- ── App config ──────────────────────────────────────────────────────────────
insert into public.app_config (key, value)
values ('booking_form_min_helpers', '1'::jsonb)
on conflict (key) do nothing;

-- ── Pilot helper auth users (phone OTP flow; email is placeholder only) ─────
-- These are seed accounts for the pilot. They cannot sign in via email.
-- IDs are fixed so the migration is idempotent.
insert into auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
) values
  (
    'a1000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated', 'authenticated',
    'pilot.helper.1@siza.internal', '',
    now(), now(), now(),
    '{"provider":"phone","providers":["phone"]}'::jsonb, '{}'::jsonb, false
  ),
  (
    'a1000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated', 'authenticated',
    'pilot.helper.2@siza.internal', '',
    now(), now(), now(),
    '{"provider":"phone","providers":["phone"]}'::jsonb, '{}'::jsonb, false
  ),
  (
    'a1000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated', 'authenticated',
    'pilot.helper.3@siza.internal', '',
    now(), now(), now(),
    '{"provider":"phone","providers":["phone"]}'::jsonb, '{}'::jsonb, false
  )
on conflict (id) do nothing;

-- ── Profiles ─────────────────────────────────────────────────────────────────
insert into public.profiles (
  id, role, first_name, last_name, phone,
  terms_version, terms_accepted_at,
  privacy_version, privacy_accepted_at,
  created_at, updated_at
) values
  (
    'a1000000-0000-0000-0000-000000000001'::uuid,
    'helper', 'Thandi', 'Dlamini', '+27610000001',
    'v1', now(), 'v1', now(), now(), now()
  ),
  (
    'a1000000-0000-0000-0000-000000000002'::uuid,
    'helper', 'Nomsa', 'Khumalo', '+27610000002',
    'v1', now(), 'v1', now(), now(), now()
  ),
  (
    'a1000000-0000-0000-0000-000000000003'::uuid,
    'helper', 'Sipho', 'Nkosi', '+27610000003',
    'v1', now(), 'v1', now(), now(), now()
  )
on conflict (id) do nothing;

-- ── Helper details ────────────────────────────────────────────────────────────
-- Each helper covers all pilot suburbs so every suburb appears in the booking
-- form. Services match the rate_card keys seeded in migration 0150000.
insert into public.helper_details (
  user_id, date_of_birth, job_title, services, suburbs,
  bio, status, approved_at,
  subscription_status,
  created_at, updated_at
) values
  (
    'a1000000-0000-0000-0000-000000000001'::uuid,
    '1990-03-15'::date,
    'Domestic Helper',
    ARRAY['home', 'home_cleaning', 'deep_cleaning', 'airbnb_turnover'],
    ARRAY['Rosebank','Sandton','Parkhurst','Craighall','Melville',
          'Braamfontein','Fourways','Midrand','Vanderbijlpark','Vereeniging'],
    'Experienced domestic helper covering Johannesburg and Vaal.',
    'approved', now(),
    'none',
    now(), now()
  ),
  (
    'a1000000-0000-0000-0000-000000000002'::uuid,
    '1992-07-22'::date,
    'Domestic Helper',
    ARRAY['home', 'home_cleaning', 'deep_cleaning', 'airbnb_turnover'],
    ARRAY['Rosebank','Sandton','Parkhurst','Craighall','Melville',
          'Braamfontein','Fourways','Midrand','Vanderbijlpark','Vereeniging'],
    'Detail-oriented helper with 5 years experience.',
    'approved', now(),
    'none',
    now(), now()
  ),
  (
    'a1000000-0000-0000-0000-000000000003'::uuid,
    '1988-11-05'::date,
    'Domestic Helper',
    ARRAY['home', 'home_cleaning', 'deep_cleaning', 'airbnb_turnover'],
    ARRAY['Rosebank','Sandton','Parkhurst','Craighall','Melville',
          'Braamfontein','Fourways','Midrand','Vanderbijlpark','Vereeniging'],
    'Reliable and punctual, specialising in deep cleans.',
    'approved', now(),
    'none',
    now(), now()
  )
on conflict (user_id) do nothing;

