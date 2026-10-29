-- Phase A core schema. 0001_init.sql is already applied and immutable.
-- New objects use helper terminology and are additive/forward-only.

create type public.siza_role as enum ('host', 'helper', 'admin');
create type public.helper_profile_status as enum ('pending', 'approved', 'declined', 'suspended');
create type public.subscription_status as enum ('none', 'active', 'lapsed');
create type public.siza_booking_status as enum ('open', 'assigned', 'in_progress', 'completed', 'cancelled', 'disputed', 'expired');
create type public.booking_assignment_status as enum ('accepted', 'cancelled', 'completed', 'no_show');
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
create type public.private_document_type as enum ('id_photo', 'selfie_check');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.siza_role not null,
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text check (last_name is null or char_length(last_name) between 1 and 120),
  phone text not null unique check (phone ~ '^\\+27[6-8][0-9]{8}$'),
  avatar_path text,
  terms_version text not null,
  terms_accepted_at timestamptz not null,
  privacy_version text not null,
  privacy_accepted_at timestamptz not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.host_details (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  address_line text not null check (char_length(address_line) between 5 and 300),
  suburb text not null check (char_length(suburb) between 2 and 80),
  city text not null default 'Johannesburg' check (char_length(city) between 2 and 80),
  notes_default text not null default '' check (char_length(notes_default) <= 2000),
  updated_at timestamptz not null default now()
);

create table public.helper_details (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  date_of_birth date not null,
  job_title text not null check (char_length(job_title) between 2 and 120),
  services text[] not null check (cardinality(services) between 1 and 10),
  suburbs text[] not null check (cardinality(suburbs) between 1 and 50),
  bio text not null default '' check (char_length(bio) <= 300),
  experience_note text not null default '' check (char_length(experience_note) <= 2000),
  rate_note text not null default '' check (char_length(rate_note) <= 500),
  status public.helper_profile_status not null default 'pending',
  decline_reason text,
  approved_at timestamptz,
  vetted_at timestamptz,
  check_notes_private text,
  rating_avg numeric(3,2) not null default 0 check (rating_avg between 0 and 5),
  rating_count integer not null default 0 check (rating_count >= 0),
  strikes integer not null default 0 check (strikes >= 0),
  id_number_encrypted text,
  id_hash text unique,
  first_job_completed_at timestamptz,
  subscription_status public.subscription_status not null default 'none',
  subscription_paid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.helper_private_docs (
  id uuid primary key default gen_random_uuid(),
  helper_id uuid not null references public.profiles(id) on delete cascade,
  type public.private_document_type not null,
  storage_path text not null unique,
  delete_after timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 80),
  titles text[] not null default '{}',
  enabled boolean not null default true,
  requires_licence boolean not null default false,
  pricing text not null check (pricing in ('rate_card', 'host_budget', 'quote')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rate_card (
  id uuid primary key default gen_random_uuid(),
  service text not null unique,
  hourly_cents bigint not null check (hourly_cents >= 0),
  per_bedroom_minutes integer not null default 0 check (per_bedroom_minutes >= 0),
  per_bathroom_minutes integer not null default 0 check (per_bathroom_minutes >= 0),
  addon_minutes jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.transport_zones (
  suburb text primary key,
  region text not null check (region in ('johannesburg', 'vaal')),
  zone text not null,
  transport_cents bigint not null check (transport_cents >= 0),
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.phase_a_bookings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id),
  address_line text not null check (char_length(address_line) between 5 and 300),
  suburb text not null check (char_length(suburb) between 2 and 80),
  city text not null default 'Johannesburg' check (char_length(city) between 2 and 80),
  services text[] not null check (cardinality(services) between 1 and 10),
  helpers_needed integer not null check (helpers_needed between 1 and 4),
  start_at timestamptz not null,
  end_at_est timestamptz not null,
  pay_per_helper_cents bigint not null check (pay_per_helper_cents >= 0),
  transport_per_helper_cents bigint not null check (transport_per_helper_cents >= 0),
  service_fee_cents bigint not null default 0 check (service_fee_cents >= 0),
  check_in_code_hash text,
  code_attempts integer not null default 0 check (code_attempts >= 0),
  code_locked_until timestamptz,
  check_in_code_expires_at timestamptz,
  access_notes text not null default '' check (char_length(access_notes) <= 2000),
  status public.siza_booking_status not null default 'open',
  created_at timestamptz not null default now(),
  assigned_at timestamptz,
  completed_at timestamptz,
  idempotency_key uuid not null unique,
  updated_at timestamptz not null default now(),
  constraint phase_a_booking_time_order check (end_at_est > start_at)
);

create table public.booking_assignments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.phase_a_bookings(id) on delete cascade,
  helper_id uuid not null references public.profiles(id),
  slot integer not null check (slot between 1 and 4),
  status public.booking_assignment_status not null default 'accepted',
  accepted_at timestamptz not null default now(),
  checked_in_at timestamptz,
  host_confirmed_at timestamptz,
  helper_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (booking_id, slot),
  unique (booking_id, helper_id)
);

create table public.booking_offers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.phase_a_bookings(id) on delete cascade,
  helper_id uuid not null references public.profiles(id),
  slot integer not null check (slot between 1 and 4),
  offered_at timestamptz not null default now(),
  expires_at timestamptz not null,
  unique (booking_id, helper_id, slot)
);

create table public.phase_a_reports (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.phase_a_bookings(id) on delete set null,
  reporter_id uuid not null references public.profiles(id),
  subject_id uuid references public.profiles(id),
  category text not null check (category in ('no_show', 'safety', 'payment', 'conduct', 'other')),
  text text not null check (char_length(text) between 1 and 3000),
  status public.report_status not null default 'open',
  admin_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.phase_a_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  at timestamptz not null default now()
);

insert into public.app_config (key, value) values
  ('offer_window_minutes', '10'::jsonb),
  ('no_show_minutes', '30'::jsonb),
  ('check_in_lock_minutes', '15'::jsonb),
  ('id_doc_retention_days', '30'::jsonb),
  ('check_in_expiry_hours', '12'::jsonb),
  ('confirm_grace_hours', '12'::jsonb),
  ('auto_release_hours', '24'::jsonb)
on conflict (key) do nothing;

create index phase_a_bookings_host_idx on public.phase_a_bookings(host_id, created_at desc);
create index phase_a_bookings_open_idx on public.phase_a_bookings(status, start_at) where status = 'open';
create index booking_assignments_helper_idx on public.booking_assignments(helper_id, accepted_at desc);
create index booking_offers_helper_idx on public.booking_offers(helper_id, expires_at);
create index phase_a_reports_status_idx on public.phase_a_reports(status, created_at);
create index helper_private_docs_helper_idx on public.helper_private_docs(helper_id);

alter table public.profiles enable row level security;
alter table public.host_details enable row level security;
alter table public.helper_details enable row level security;
alter table public.helper_private_docs enable row level security;
alter table public.service_categories enable row level security;
alter table public.rate_card enable row level security;
alter table public.transport_zones enable row level security;
alter table public.app_config enable row level security;
alter table public.phase_a_bookings enable row level security;
alter table public.booking_assignments enable row level security;
alter table public.booking_offers enable row level security;
alter table public.phase_a_reports enable row level security;
alter table public.phase_a_audit_log enable row level security;

create policy profiles_self_read on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_admin());
create policy profiles_self_write on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy host_details_owner on public.host_details for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());
create policy helper_details_owner on public.helper_details for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());
create policy helper_private_docs_admin on public.helper_private_docs for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy service_categories_admin on public.service_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy rate_card_admin on public.rate_card for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy transport_zones_admin on public.transport_zones for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy app_config_admin on public.app_config for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy phase_a_bookings_owner on public.phase_a_bookings for select to authenticated using (host_id = (select auth.uid()) or public.is_admin());
create policy booking_assignments_participant on public.booking_assignments for select to authenticated using (helper_id = (select auth.uid()) or exists (select 1 from public.phase_a_bookings b where b.id = booking_id and b.host_id = (select auth.uid())) or public.is_admin());
create policy booking_offers_helper on public.booking_offers for select to authenticated using (helper_id = (select auth.uid()) or public.is_admin());
create policy phase_a_reports_participant on public.phase_a_reports for select to authenticated using (reporter_id = (select auth.uid()) or subject_id = (select auth.uid()) or public.is_admin());
create policy phase_a_reports_insert on public.phase_a_reports for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy phase_a_audit_admin on public.phase_a_audit_log for select to authenticated using (public.is_admin());

revoke all on public.profiles, public.host_details, public.helper_details, public.helper_private_docs,
  public.service_categories, public.rate_card, public.transport_zones, public.app_config,
  public.phase_a_bookings, public.booking_assignments, public.booking_offers,
  public.phase_a_reports, public.phase_a_audit_log from anon;

create or replace function public.claim_phase_a_slot(p_booking_id uuid, p_helper_id uuid, p_slot integer)
returns public.booking_assignments
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.booking_assignments;
begin
  if p_slot < 1 or p_slot > 4 then raise exception 'invalid_slot'; end if;
  insert into public.booking_assignments (booking_id, helper_id, slot)
  select p_booking_id, p_helper_id, p_slot
  from public.phase_a_bookings b
  join public.helper_details h on h.user_id = p_helper_id
  where b.id = p_booking_id
    and b.status in ('open', 'assigned')
    and h.status = 'approved'
    and (h.first_job_completed_at is null or (h.subscription_status = 'active' and h.subscription_paid_until > now()))
    and (
      exists (select 1 from public.booking_offers o where o.booking_id = p_booking_id and o.helper_id = p_helper_id and o.slot = p_slot and o.expires_at > now())
      or not exists (select 1 from public.booking_offers o where o.booking_id = p_booking_id and o.slot = p_slot and o.expires_at > now())
    )
    and not exists (select 1 from public.booking_assignments a where a.booking_id = p_booking_id and a.helper_id = p_helper_id)
  returning * into result;
  if result.id is null then raise exception 'slot_unavailable'; end if;
  update public.phase_a_bookings b
  set status = case when (select count(*) from public.booking_assignments a where a.booking_id = b.id and a.status = 'accepted') >= b.helpers_needed then 'assigned' else 'open' end,
      assigned_at = case when (select count(*) from public.booking_assignments a where a.booking_id = b.id and a.status = 'accepted') >= b.helpers_needed then coalesce(b.assigned_at, now()) else b.assigned_at end,
      updated_at = now()
  where b.id = p_booking_id;
  return result;
end;
$$;

create or replace function public.record_phase_a_code_attempt(p_booking_id uuid, p_now timestamptz, p_matches boolean, p_lock_minutes integer default 15)
returns table (accepted boolean, attempts integer, locked_until timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_booking public.phase_a_bookings;
begin
  select * into current_booking from public.phase_a_bookings where id = p_booking_id for update;
  if current_booking.id is null or current_booking.check_in_code_expires_at is null or current_booking.check_in_code_expires_at <= p_now then
    return query select false, coalesce(current_booking.code_attempts, 0), current_booking.code_locked_until;
  end if;
  if current_booking.code_locked_until is not null and current_booking.code_locked_until > p_now then
    return query select false, current_booking.code_attempts, current_booking.code_locked_until;
  end if;
  if p_matches then
    update public.phase_a_bookings set code_attempts = 0, code_locked_until = null, status = 'in_progress', updated_at = p_now where id = p_booking_id;
    return query select true, 0, null::timestamptz;
  end if;
  update public.phase_a_bookings
  set code_attempts = code_attempts + 1,
      code_locked_until = case when code_attempts + 1 >= 5 then p_now + make_interval(mins => p_lock_minutes) else code_locked_until end,
      updated_at = p_now
  where id = p_booking_id;
  return query select false, current_booking.code_attempts + 1,
    case when current_booking.code_attempts + 1 >= 5 then p_now + make_interval(mins => p_lock_minutes) else current_booking.code_locked_until end;
end;
$$;

create or replace function public.create_phase_a_offers(p_booking_id uuid, p_offer_minutes integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  booking_row public.phase_a_bookings;
  slot_number integer;
  inserted_count integer := 0;
  row_count integer := 0;
begin
  if p_offer_minutes < 1 or p_offer_minutes > 1440 then raise exception 'invalid_offer_window'; end if;
  select * into booking_row from public.phase_a_bookings where id = p_booking_id and status = 'open';
  if booking_row.id is null then return 0; end if;
  for slot_number in 1..booking_row.helpers_needed loop
    insert into public.booking_offers (booking_id, helper_id, slot, offered_at, expires_at)
    select booking_row.id, h.user_id, slot_number, now(), now() + make_interval(mins => p_offer_minutes)
    from public.helper_details h
    where h.status = 'approved'
      and h.suburbs @> array[booking_row.suburb]
      and h.services && booking_row.services
      and not exists (select 1 from public.booking_assignments a where a.booking_id = booking_row.id and a.helper_id = h.user_id)
      and (h.first_job_completed_at is null or (h.subscription_status = 'active' and h.subscription_paid_until > now()))
    order by
      (select count(*) from public.booking_assignments a where a.helper_id = h.user_id and a.accepted_at >= now() - interval '30 days'),
      (select max(a.accepted_at) from public.booking_assignments a where a.helper_id = h.user_id),
      random()
    limit 3
    on conflict do nothing;
    get diagnostics row_count = ROW_COUNT;
    inserted_count := inserted_count + row_count;
  end loop;
  return inserted_count;
end;
$$;
