-- Migration: Add post-job rating and feedback_notes to booking_assignments
-- Phase A forward-only quality tracking

alter table public.booking_assignments
  add column if not exists rating smallint check (rating between 1 and 5),
  add column if not exists feedback_notes text check (char_length(feedback_notes) <= 1000);

comment on column public.booking_assignments.rating is
  'Host post-job rating (1 to 5 stars). Null = unrated.';
comment on column public.booking_assignments.feedback_notes is
  'Private feedback notes from host after job completion.';

