-- Phase B marketplace core schema: financial, KYC, tracking, analytics, and support tables.
-- All money columns are bigint (integer cents). Ledger rows are append-only.
-- Uses helper terminology throughout. Follows conventions from 0003_phase_a_core.sql.

-- ============================================================
-- Enums
-- ============================================================

create type public.payment_status as enum ('pending', 'paid', 'refunded', 'failed', 'disputed');

create type public.ledger_entry_kind as enum ('host_payment', 'held', 'platform_fee', 'helper_payable', 'payout', 'refund', 'adjustment');

create type public.payout_status as enum ('queued', 'sent', 'failed');

create type public.kyc_status as enum ('pending', 'verified', 'failed', 'expired');

create type public.strike_reason as enum ('no_show', 'misconduct', 'fraud');

create type public.strike_action as enum ('warning', 'suspension_7d', 'deactivation');

create type public.support_ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');

create type public.cancellation_type as enum ('host_before_assignment', 'host_gt_4h', 'host_lt_4h', 'helper_no_show');

-- ============================================================
-- Tables
-- ============================================================

-- Payments: holds card-payment records from the payment provider.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.phase_a_bookings(id),
  provider text not null check (provider in ('paystack', 'mock')),
  provider_ref text not null unique,
  amount_cents bigint not null check (amount_cents > 0),
  fee_cents bigint not null default 0 check (fee_cents >= 0),
  currency text not null default 'ZAR' check (currency = 'ZAR'),
  status public.payment_status not null default 'pending',
  idempotency_key uuid not null unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ledger entries: append-only double-entry-style records.
create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.phase_a_bookings(id),
  payment_id uuid references public.payments(id),
  kind public.ledger_entry_kind not null,
  amount_cents bigint not null check (amount_cents > 0),
  description text not null default '',
  ref text,
  created_at timestamptz not null default now()
);

-- Append-only enforcement: no updates or deletes allowed on ledger_entries.
create function public.forbid_ledger_change() returns trigger language plpgsql as $$
begin
  raise exception 'ledger_entries is append-only: updates and deletes are forbidden';
end;
$$;

create trigger ledger_no_update
  before update or delete on public.ledger_entries
  for each row execute function public.forbid_ledger_change();

-- Helper bank accounts: encrypted account details for payouts.
create table public.helper_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  helper_id uuid not null unique references public.profiles(id),
  account_holder text not null check (char_length(account_holder) between 2 and 200),
  bank_name text not null check (char_length(bank_name) between 2 and 100),
  account_no_encrypted text not null,
  branch_code text not null check (branch_code ~ '^\d{6}$'),
  account_type text not null check (account_type in ('cheque', 'savings', 'transmission')),
  verified_at timestamptz,
  paystack_recipient_code text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Payouts: records of money sent to helpers.
create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  helper_id uuid not null references public.profiles(id),
  amount_cents bigint not null check (amount_cents > 0),
  status public.payout_status not null default 'queued',
  method text not null default 'eft' check (method in ('eft', 'paystack_transfer')),
  bank_account_id uuid references public.helper_bank_accounts(id),
  ref text,
  sent_at timestamptz,
  failed_reason text,
  idempotency_key uuid not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- KYC verifications: identity-verification records for helpers.
create table public.kyc_verifications (
  id uuid primary key default gen_random_uuid(),
  helper_id uuid not null references public.profiles(id),
  vendor text not null check (vendor in ('smile_id', 'manual', 'mock')),
  vendor_ref text,
  id_hash text not null,
  dha_match boolean,
  liveness_score numeric(5,4),
  liveness_passed boolean,
  status public.kyc_status not null default 'pending',
  consent_text text not null,
  consent_version text not null,
  consent_accepted_at timestamptz not null,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Location pings: GPS breadcrumbs during active bookings.
create table public.location_pings (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.phase_a_bookings(id),
  helper_id uuid not null references public.profiles(id),
  lat numeric(9,6) not null check (lat between -90 and 90),
  lng numeric(9,6) not null check (lng between -90 and 180),
  accuracy_m numeric(7,1),
  created_at timestamptz not null default now()
);

-- Strike records: disciplinary records for helpers.
create table public.strike_records (
  id uuid primary key default gen_random_uuid(),
  helper_id uuid not null references public.profiles(id),
  booking_id uuid references public.phase_a_bookings(id),
  reason public.strike_reason not null,
  strike_number integer not null check (strike_number between 1 and 10),
  action_taken public.strike_action not null,
  reviewer_id uuid not null references public.profiles(id),
  notes text default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now()
);

-- Cancellation records: booking cancellation details and refund/compensation amounts.
create table public.cancellation_records (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.phase_a_bookings(id),
  cancelled_by uuid not null references public.profiles(id),
  type public.cancellation_type not null,
  refund_amount_cents bigint not null default 0 check (refund_amount_cents >= 0),
  helper_compensation_cents bigint not null default 0 check (helper_compensation_cents >= 0),
  reason text default '',
  policy_snapshot text not null,
  created_at timestamptz not null default now()
);

-- Analytics events: first-party product analytics (no PII in metadata).
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (char_length(event_name) between 1 and 100),
  user_id uuid references public.profiles(id),
  user_role text,
  session_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Support tickets: user-submitted support requests.
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  category text not null check (category in ('payment', 'booking', 'helper_issue', 'account', 'other')),
  subject text not null check (char_length(subject) between 5 and 200),
  message text not null check (char_length(message) between 10 and 5000),
  status public.support_ticket_status not null default 'open',
  admin_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- App config seeds (Phase B business numbers)
-- ============================================================

insert into public.app_config (key, value) values
  ('service_fee_percent', '10'::jsonb),
  ('service_fee_min_cents', '5000'::jsonb),
  ('cancellation_helper_compensation_cents', '10000'::jsonb),
  ('strike_limit', '3'::jsonb),
  ('suspension_days', '7'::jsonb),
  ('payout_min_cents', '5000'::jsonb),
  ('location_ping_interval_seconds', '10'::jsonb),
  ('location_ping_max_age_hours', '24'::jsonb)
on conflict (key) do nothing;

-- ============================================================
-- Indexes
-- ============================================================

create index payments_booking_idx on public.payments(booking_id);
-- provider_ref already has a unique index; skip redundant explicit index.
create index ledger_entries_booking_idx on public.ledger_entries(booking_id, created_at);
create index payouts_helper_idx on public.payouts(helper_id, created_at desc);
create index payouts_status_idx on public.payouts(status) where status = 'queued';
create index kyc_verifications_helper_idx on public.kyc_verifications(helper_id, created_at desc);
create index location_pings_booking_idx on public.location_pings(booking_id, created_at desc);
create index strike_records_helper_idx on public.strike_records(helper_id, created_at);
create index analytics_events_name_idx on public.analytics_events(event_name, created_at desc);
create index support_tickets_user_idx on public.support_tickets(user_id, created_at desc);
create index support_tickets_status_idx on public.support_tickets(status, created_at) where status in ('open', 'in_progress');

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.payments enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.helper_bank_accounts enable row level security;
alter table public.payouts enable row level security;
alter table public.kyc_verifications enable row level security;
alter table public.location_pings enable row level security;
alter table public.strike_records enable row level security;
alter table public.cancellation_records enable row level security;
alter table public.analytics_events enable row level security;
alter table public.support_tickets enable row level security;

-- ============================================================
-- RLS Policies
-- ============================================================

-- payments: host reads own booking payments; helper reads payments for assigned bookings; admin reads all.
create policy payments_host_read on public.payments
  for select to authenticated
  using (
    exists (
      select 1 from public.phase_a_bookings b
      where b.id = booking_id and b.host_id = (select auth.uid())
    )
    or exists (
      select 1 from public.booking_assignments ba
      where ba.booking_id = payments.booking_id and ba.helper_id = (select auth.uid())
    )
    or public.is_admin()
  );

-- ledger_entries: admin only.
create policy ledger_entries_admin_read on public.ledger_entries
  for select to authenticated
  using (public.is_admin());

-- helper_bank_accounts: helper reads/writes own; admin reads all.
create policy helper_bank_accounts_owner_read on public.helper_bank_accounts
  for select to authenticated
  using (helper_id = (select auth.uid()) or public.is_admin());

create policy helper_bank_accounts_owner_insert on public.helper_bank_accounts
  for insert to authenticated
  with check (helper_id = (select auth.uid()));

create policy helper_bank_accounts_owner_update on public.helper_bank_accounts
  for update to authenticated
  using (helper_id = (select auth.uid()))
  with check (helper_id = (select auth.uid()));

-- payouts: helper reads own; admin reads/writes all.
create policy payouts_helper_read on public.payouts
  for select to authenticated
  using (helper_id = (select auth.uid()) or public.is_admin());

create policy payouts_admin_insert on public.payouts
  for insert to authenticated
  with check (public.is_admin());

create policy payouts_admin_update on public.payouts
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- kyc_verifications: helper reads own; admin reads/writes all.
create policy kyc_verifications_helper_read on public.kyc_verifications
  for select to authenticated
  using (helper_id = (select auth.uid()) or public.is_admin());

create policy kyc_verifications_admin_insert on public.kyc_verifications
  for insert to authenticated
  with check (public.is_admin());

create policy kyc_verifications_admin_update on public.kyc_verifications
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- location_pings: helper inserts own; host reads for own bookings; admin reads all.
create policy location_pings_helper_insert on public.location_pings
  for insert to authenticated
  with check (helper_id = (select auth.uid()));

create policy location_pings_read on public.location_pings
  for select to authenticated
  using (
    exists (
      select 1 from public.phase_a_bookings b
      where b.id = booking_id and b.host_id = (select auth.uid())
    )
    or public.is_admin()
  );

-- strike_records: helper reads own; admin reads/writes all.
create policy strike_records_helper_read on public.strike_records
  for select to authenticated
  using (helper_id = (select auth.uid()) or public.is_admin());

create policy strike_records_admin_insert on public.strike_records
  for insert to authenticated
  with check (public.is_admin());

create policy strike_records_admin_update on public.strike_records
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- cancellation_records: booking host reads; admin reads all.
create policy cancellation_records_host_read on public.cancellation_records
  for select to authenticated
  using (
    exists (
      select 1 from public.phase_a_bookings b
      where b.id = booking_id and b.host_id = (select auth.uid())
    )
    or public.is_admin()
  );

-- analytics_events: admin reads only. Inserts happen via service_role.
create policy analytics_events_admin_read on public.analytics_events
  for select to authenticated
  using (public.is_admin());

-- support_tickets: user reads/inserts own; admin reads/updates all.
create policy support_tickets_user_read on public.support_tickets
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy support_tickets_user_insert on public.support_tickets
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy support_tickets_admin_update on public.support_tickets
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- Revoke anon access from all new tables
-- ============================================================

revoke all on public.payments,
  public.ledger_entries,
  public.helper_bank_accounts,
  public.payouts,
  public.kyc_verifications,
  public.location_pings,
  public.strike_records,
  public.cancellation_records,
  public.analytics_events,
  public.support_tickets
from anon;

-- ============================================================
-- Grants for authenticated role (RLS still enforces row access)
-- ============================================================

grant select on table
  public.payments,
  public.ledger_entries,
  public.payouts,
  public.kyc_verifications,
  public.strike_records,
  public.cancellation_records,
  public.analytics_events
to authenticated;

grant select, insert, update on table
  public.helper_bank_accounts
to authenticated;

grant select, insert on table
  public.location_pings
to authenticated;

grant select, insert, update on table
  public.support_tickets
to authenticated;

-- ============================================================
-- Grants for service_role (server-side access, bypasses RLS)
-- ============================================================

grant select, insert, update, delete on table
  public.payments,
  public.ledger_entries,
  public.helper_bank_accounts,
  public.payouts,
  public.kyc_verifications,
  public.location_pings,
  public.strike_records,
  public.cancellation_records,
  public.analytics_events,
  public.support_tickets
to service_role;
