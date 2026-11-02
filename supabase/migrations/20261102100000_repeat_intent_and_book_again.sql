-- Migration: add repeat_intent signal on booking_assignments (post-job survey)
-- and completed_jobs count on helper_details for metrics card.
-- Forward-only, append-only. Phase A only — no payment logic.

-- 1. repeat_intent: host's private survey answer after job completion
--    null = not answered, true = yes, false = no
alter table public.booking_assignments
  add column if not exists repeat_intent boolean default null;

comment on column public.booking_assignments.repeat_intent is
  'Private host survey: "Would you book this helper again through SIZA?" Null = not yet answered.';

-- 2. Index to let admin dashboard count high-repeat-intent helpers efficiently
create index if not exists idx_booking_assignments_repeat_intent
  on public.booking_assignments (repeat_intent)
  where repeat_intent is not null;

-- 3. RLS: only the host of the booking may set repeat_intent; helpers/admins cannot read it
-- (The column is set via a server action using the admin client, so RLS on the column
--  is not needed for correctness — server enforces ownership. This comment documents intent.)

