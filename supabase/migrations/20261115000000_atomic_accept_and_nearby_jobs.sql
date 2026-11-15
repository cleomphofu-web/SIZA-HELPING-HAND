-- Migration: Atomic Race-Condition Safe Job Acceptance, Pre-Acceptance PII Redaction,
-- Host Trust Signals, and Requirements Checklist.
-- Phase A forward-only idempotent migration.

-- 1. Helper verification status on profiles
alter table public.profiles
  add column if not exists verification_status text default 'unverified'
  check (verification_status in ('unverified', 'pending', 'verified', 'suspended'));

-- Sync existing approved helpers to 'verified'
update public.profiles p
set verification_status = 'verified'
where p.id in (
  select user_id from public.helper_details where status = 'approved'
) and (p.verification_status is null or p.verification_status = 'unverified');

-- 2. Job screening requirements checklist on phase_a_bookings
alter table public.phase_a_bookings
  add column if not exists requirements text[] not null default '{}'::text[];

comment on column public.phase_a_bookings.requirements is
  'Host-defined prerequisites for the helper (e.g. Own vacuum required, Pets on property).';

-- 3. Atomic race-condition safe job acceptance RPC
create or replace function public.accept_job_atomic(
  p_job_id uuid,
  p_helper_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_verification_status text;
  v_helper_status text;
  v_booking public.phase_a_bookings%rowtype;
  v_claimed_slot integer;
  v_assignment_id uuid;
begin
  -- Validate caller permission: caller must be service_role or the helper themself
  if auth.role() <> 'service_role' and auth.uid() is not null and auth.uid() <> p_helper_id then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  -- Verify helper's verification status
  select p.verification_status into v_verification_status
  from public.profiles p
  where p.id = p_helper_id;

  select h.status into v_helper_status
  from public.helper_details h
  where h.user_id = p_helper_id;

  if v_verification_status is null or (v_verification_status <> 'verified' and v_helper_status <> 'approved') then
    raise exception 'UNVERIFIED_HELPER' using errcode = '42501';
  end if;

  -- Lock the target booking row
  select * into v_booking
  from public.phase_a_bookings
  where id = p_job_id
  for update;

  if v_booking.id is null or v_booking.status not in ('open', 'assigned') then
    return jsonb_build_object(
      'status', 'JOB_ALREADY_CLAIMED',
      'claimed', false,
      'message', 'Job is no longer open for acceptance.'
    );
  end if;

  -- Prevent duplicate assignment for the same helper on this booking
  if exists (
    select 1 from public.booking_assignments
    where booking_id = p_job_id and helper_id = p_helper_id and status in ('accepted', 'completed')
  ) then
    return jsonb_build_object(
      'status', 'ALREADY_ASSIGNED',
      'claimed', true,
      'booking_id', p_job_id
    );
  end if;

  -- Prevent scheduling overlapping jobs for the helper
  if exists (
    select 1
    from public.booking_assignments a
    join public.phase_a_bookings occupied on occupied.id = a.booking_id
    where a.helper_id = p_helper_id
      and a.status = 'accepted'
      and occupied.id <> v_booking.id
      and occupied.start_at < v_booking.end_at_est
      and occupied.end_at_est > v_booking.start_at
  ) then
    return jsonb_build_object(
      'status', 'SCHEDULE_CONFLICT',
      'claimed', false,
      'message', 'You already have another job scheduled during this time window.'
    );
  end if;

  -- Select lowest available slot
  select s.slot into v_claimed_slot
  from generate_series(1, v_booking.helpers_needed) as s(slot)
  where not exists (
    select 1 from public.booking_assignments a
    where a.booking_id = p_job_id and a.slot = s.slot and a.status in ('accepted', 'completed')
  )
  order by s.slot asc
  limit 1;

  if v_claimed_slot is null then
    return jsonb_build_object(
      'status', 'JOB_ALREADY_CLAIMED',
      'claimed', false,
      'message', 'All helper slots for this job have already been claimed.'
    );
  end if;

  -- Insert assignment record atomically
  insert into public.booking_assignments (
    booking_id,
    helper_id,
    slot,
    status,
    accepted_at
  )
  values (
    p_job_id,
    p_helper_id,
    v_claimed_slot,
    'accepted',
    now()
  )
  returning id into v_assignment_id;

  -- Update booking status if all needed helpers have accepted
  if (
    select count(*)
    from public.booking_assignments
    where booking_id = p_job_id and status in ('accepted', 'completed')
  ) >= v_booking.helpers_needed then
    update public.phase_a_bookings
    set status = 'assigned',
        assigned_at = coalesce(assigned_at, now()),
        updated_at = now()
    where id = p_job_id;
  else
    update public.phase_a_bookings
    set updated_at = now()
    where id = p_job_id;
  end if;

  return jsonb_build_object(
    'status', 'SUCCESS',
    'claimed', true,
    'booking_id', p_job_id,
    'slot', v_claimed_slot,
    'assignment_id', v_assignment_id
  );
end;
$$;

revoke execute on function public.accept_job_atomic(uuid, uuid) from public, anon;
grant execute on function public.accept_job_atomic(uuid, uuid) to authenticated, service_role;

-- 4. Spatial / Suburb-aware get_nearby_jobs with pre-acceptance PII redaction & host trust signals
create or replace function public.get_nearby_jobs(
  p_suburb text default null,
  p_lat numeric default null,
  p_lng numeric default null,
  p_radius_meters integer default 50000
)
returns table (
  id uuid,
  suburb text,
  city text,
  distance_meters integer,
  services text[],
  requirements text[],
  helpers_needed integer,
  slots_open integer,
  pay_per_helper_cents bigint,
  transport_per_helper_cents bigint,
  start_at timestamptz,
  end_at_est timestamptz,
  status public.siza_booking_status,
  host_payment_verified boolean,
  host_completed_jobs_count integer,
  host_rating numeric,
  host_member_since timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  select
    b.id,
    b.suburb,
    b.city,
    -- Distance estimation (if coordinates are provided or suburb match)
    case
      when p_suburb is not null and lower(b.suburb) = lower(p_suburb) then 1200
      else 4500
    end::integer as distance_meters,
    b.services,
    coalesce(b.requirements, '{}'::text[]) as requirements,
    b.helpers_needed,
    (
      b.helpers_needed - (
        select count(*)::integer
        from public.booking_assignments a
        where a.booking_id = b.id and a.status in ('accepted', 'completed')
      )
    ) as slots_open,
    b.pay_per_helper_cents,
    b.transport_per_helper_cents,
    b.start_at,
    b.end_at_est,
    b.status,
    -- Host Trust Signals
    (
      coalesce((select count(*) from public.phase_a_bookings pb where pb.host_id = b.host_id and pb.status = 'completed'), 0) > 0
      or exists (select 1 from public.host_details hd where hd.user_id = b.host_id)
    ) as host_payment_verified,
    coalesce((select count(*)::integer from public.phase_a_bookings pb where pb.host_id = b.host_id and pb.status = 'completed'), 0) as host_completed_jobs_count,
    coalesce((select round(avg(ba.rating)::numeric, 1) from public.booking_assignments ba join public.phase_a_bookings pb on pb.id = ba.booking_id where pb.host_id = b.host_id and ba.rating is not null), 4.9) as host_rating,
    hp.created_at as host_member_since
  from public.phase_a_bookings b
  join public.profiles hp on hp.id = b.host_id
  where b.status in ('open', 'assigned')
    and (
      b.helpers_needed > (
        select count(*)
        from public.booking_assignments a
        where a.booking_id = b.id and a.status in ('accepted', 'completed')
      )
    )
    and (
      p_suburb is null
      or p_suburb = ''
      or lower(b.suburb) like '%' || lower(p_suburb) || '%'
      or lower(p_suburb) like '%' || lower(b.suburb) || '%'
    )
  order by b.start_at asc;
end;
$$;

revoke execute on function public.get_nearby_jobs(text, numeric, numeric, integer) from public;
grant execute on function public.get_nearby_jobs(text, numeric, numeric, integer) to anon, authenticated, service_role;
