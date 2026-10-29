-- Keep a new request and its first helper offers in one transaction.
-- Migration 0001 and previously applied migrations are immutable.

create or replace function public.create_phase_a_offers(p_booking_id uuid, p_offer_minutes integer)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  booking_row public.phase_a_bookings;
  slot_number integer;
  inserted_count integer := 0;
  row_count integer := 0;
  offer_seed text := gen_random_uuid()::text;
begin
  if p_offer_minutes < 1 or p_offer_minutes > 1440 then
    raise exception 'invalid_offer_window' using errcode = '22023';
  end if;

  select * into booking_row
  from public.phase_a_bookings
  where id = p_booking_id and status = 'open'
  for update;
  if booking_row.id is null then return 0; end if;

  if exists (select 1 from public.booking_offers o where o.booking_id = booking_row.id)
    and not exists (
      select 1
      from generate_series(1, booking_row.helpers_needed) as requested_slot(slot)
      where (select count(*) from public.booking_offers o where o.booking_id = booking_row.id and o.slot = requested_slot.slot) < 3
    ) then
    return 0;
  end if;

  for slot_number in 1..booking_row.helpers_needed loop
    insert into public.booking_offers (booking_id, helper_id, slot, offered_at, expires_at)
    select booking_row.id, ranked.user_id, slot_number, now(), now() + make_interval(mins => p_offer_minutes)
    from (
      select h.user_id,
        row_number() over (
          order by
            (select count(*) from public.booking_assignments a where a.helper_id = h.user_id and a.accepted_at >= now() - interval '30 days'),
            (select max(a.accepted_at) from public.booking_assignments a where a.helper_id = h.user_id),
            md5(h.user_id::text || offer_seed)
        ) as helper_rank,
        count(*) over () as eligible_count
      from public.helper_details h
      join public.profiles p on p.id = h.user_id and p.role = 'helper'
      where h.status = 'approved'
        and h.suburbs @> array[booking_row.suburb]
        and h.services @> booking_row.services
        and not exists (select 1 from public.booking_assignments a where a.booking_id = booking_row.id and a.helper_id = h.user_id)
        and (h.first_job_completed_at is null or (h.subscription_status = 'active' and h.subscription_paid_until > now()))
    ) ranked
    where ((ranked.helper_rank - 1 + slot_number - 1) % ranked.eligible_count) < 3
    order by ((ranked.helper_rank - 1 + slot_number - 1) % ranked.eligible_count)
    limit 3
    on conflict do nothing;
    get diagnostics row_count = ROW_COUNT;
    inserted_count := inserted_count + row_count;
  end loop;
  return inserted_count;
end;
$$;

create or replace function public.create_phase_a_booking_with_offers(
  p_host_id uuid,
  p_address_line text,
  p_suburb text,
  p_city text,
  p_services text[],
  p_helpers_needed integer,
  p_start_at timestamptz,
  p_end_at_est timestamptz,
  p_estimated_minutes integer,
  p_estimate_inputs jsonb,
  p_gender_pref text,
  p_pay_per_helper_cents bigint,
  p_transport_per_helper_cents bigint,
  p_access_notes text,
  p_idempotency_key uuid,
  p_offer_minutes integer
)
returns table (id uuid, pay_per_helper_cents bigint, transport_per_helper_cents bigint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  booking_row public.phase_a_bookings;
  slot_number integer;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  if p_host_id is null or not exists (
    select 1 from public.profiles p where p.id = p_host_id and p.role = 'host'
  ) then
    raise exception 'host_required' using errcode = '42501';
  end if;
  if p_idempotency_key is null
    or char_length(trim(coalesce(p_address_line, ''))) not between 5 and 300
    or char_length(trim(coalesce(p_suburb, ''))) not between 2 and 80
    or char_length(trim(coalesce(p_city, ''))) not between 2 and 80
    or coalesce(cardinality(p_services), 0) not between 1 and 10
    or array_position(p_services, null::text) is not null
    or (select count(distinct selected.service) from unnest(p_services) as selected(service)) <> cardinality(p_services)
    or p_helpers_needed is null or p_helpers_needed not between 1 and 4
    or p_start_at is null or p_start_at <= now()
    or p_end_at_est is null or p_end_at_est <= p_start_at
    or p_estimated_minutes is null or p_estimated_minutes not between 1 and 1440
    or p_end_at_est <> p_start_at + make_interval(mins => p_estimated_minutes)
    or jsonb_typeof(p_estimate_inputs) is distinct from 'object'
    or p_gender_pref is null or p_gender_pref not in ('any', 'female', 'male', 'mix')
    or p_pay_per_helper_cents is null or p_pay_per_helper_cents < 0
    or p_transport_per_helper_cents is null or p_transport_per_helper_cents < 0
    or char_length(coalesce(p_access_notes, '')) > 2000
    or p_offer_minutes is null or p_offer_minutes not between 1 and 1440 then
    raise exception 'invalid_host_booking' using errcode = '22023';
  end if;

  -- Serialize retries that arrive before the first insert commits.
  perform pg_advisory_xact_lock(hashtextextended(p_host_id::text || ':' || p_idempotency_key::text, 0));

  select b.* into booking_row
  from public.phase_a_bookings b
  where b.host_id = p_host_id and b.idempotency_key = p_idempotency_key
  for update;
  if booking_row.id is not null then
    if booking_row.status = 'open' then
      perform public.create_phase_a_offers(booking_row.id, p_offer_minutes);
      for slot_number in 1..booking_row.helpers_needed loop
        if (select count(*) from public.booking_offers o where o.booking_id = booking_row.id and o.slot = slot_number) < 3 then
          raise exception 'insufficient_eligible_helpers' using errcode = 'P0001';
        end if;
      end loop;
    end if;
    return query select booking_row.id, booking_row.pay_per_helper_cents, booking_row.transport_per_helper_cents;
    return;
  end if;

  if (
    select count(*)
    from public.helper_details h
    join public.profiles p on p.id = h.user_id and p.role = 'helper'
    where h.status = 'approved'
      and h.suburbs @> array[p_suburb]
      and h.services @> p_services
      and (h.first_job_completed_at is null or (h.subscription_status = 'active' and h.subscription_paid_until > now()))
  ) < p_helpers_needed then
    raise exception 'insufficient_distinct_eligible_helpers' using errcode = 'P0001';
  end if;

  insert into public.phase_a_bookings (
    host_id, address_line, suburb, city, services, helpers_needed,
    start_at, end_at_est, estimated_minutes, estimate_inputs, gender_pref,
    pay_per_helper_cents, transport_per_helper_cents, access_notes, idempotency_key
  ) values (
    p_host_id, trim(p_address_line), trim(p_suburb), trim(p_city), p_services, p_helpers_needed,
    p_start_at, p_end_at_est, p_estimated_minutes, p_estimate_inputs, p_gender_pref,
    p_pay_per_helper_cents, p_transport_per_helper_cents, coalesce(p_access_notes, ''), p_idempotency_key
  ) returning * into booking_row;

  perform public.create_phase_a_offers(booking_row.id, p_offer_minutes);
  for slot_number in 1..p_helpers_needed loop
    if (select count(*) from public.booking_offers o where o.booking_id = booking_row.id and o.slot = slot_number) < 3 then
      raise exception 'insufficient_eligible_helpers' using errcode = 'P0001';
    end if;
  end loop;

  return query select booking_row.id, booking_row.pay_per_helper_cents, booking_row.transport_per_helper_cents;
end;
$$;

create or replace function public.enforce_assigned_helper_service_coverage()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'accepted' and not exists (
    select 1
    from public.phase_a_bookings b
    join public.helper_details h on h.user_id = new.helper_id
    join public.profiles p on p.id = h.user_id and p.role = 'helper'
    where b.id = new.booking_id and h.services @> b.services
  ) then
    raise exception 'helper_service_mismatch' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger booking_assignments_service_coverage
before insert or update on public.booking_assignments
for each row execute function public.enforce_assigned_helper_service_coverage();

revoke execute on function public.create_phase_a_offers(uuid, integer) from public, anon, authenticated;
grant execute on function public.create_phase_a_offers(uuid, integer) to service_role;
revoke all on function public.create_phase_a_booking_with_offers(uuid, text, text, text, text[], integer, timestamptz, timestamptz, integer, jsonb, text, bigint, bigint, text, uuid, integer) from public, anon, authenticated;
grant execute on function public.create_phase_a_booking_with_offers(uuid, text, text, text, text[], integer, timestamptz, timestamptz, integer, jsonb, text, bigint, bigint, text, uuid, integer) to service_role;
revoke all on function public.enforce_assigned_helper_service_coverage() from public, anon, authenticated;
