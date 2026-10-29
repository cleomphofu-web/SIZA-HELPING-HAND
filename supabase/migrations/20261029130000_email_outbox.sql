-- Durable Email Outbox table and service role policies.
-- Forward-only migration for Phase A Stage 4.2.

create table if not exists public.phase_a_email_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  recipient text not null check (char_length(recipient) <= 254),
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text not null unique,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.phase_a_email_outbox enable row level security;

-- Only service role and admin can manage the outbox; deny public/anon access
revoke all on public.phase_a_email_outbox from anon, authenticated;
grant select, insert, update on public.phase_a_email_outbox to service_role;

create policy phase_a_email_outbox_service_role
  on public.phase_a_email_outbox
  for all
  to service_role
  using (true)
  with check (true);

create index if not exists phase_a_email_outbox_pending_idx
  on public.phase_a_email_outbox (created_at)
  where status = 'pending';

