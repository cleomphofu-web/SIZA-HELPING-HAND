-- Atomic no-show handling and a fresh, slot-scoped rotation round.
-- All earlier/applied migrations, including 0001_init.sql, remain immutable.

alter table public.booking_assignments
  add column no_show_at timestamptz;

update public.booking_assignments a
set no_show_at = coalesce(
  (select max(l.at) from public.phase_a_audit_log l
   where l.action = 'helper_no_show' and l.entity = 'booking_assignments' and l.entity_id = a.id),
  a.accepted_at
)
where a.status = 'no_show' and a.no_show_at is null;

alter table public.booking_assignments
  add constraint booking_assignments_no_show_at_required
  check (status <> 'no_show' or no_show_at is not null);

alter table public.booking_offers
  add column offer_round integer not null default 1 check (offer_round > 0);

alter table public.booking_offers
  drop constraint if exists booking_offers_booking_id_helper_id_slot_key;

alter table public.booking_offers
  add constraint booking_offers_booking_helper_slot_round_key
  unique (booking_id, helper_id, slot, offer_round);

create index booking_offers_slot_round_expiry_idx
  on public.booking_offers (booking_id, slot, offer_round, expires_at);

insert into public.app_config (key, value)
values ('no_show_recovery_minutes', '60'::jsonb)
on conflict (key) do nothing;

create or replace function public.create_phase_a_no_show_offers(
  p_booking_id uuid,
  p_slot integer,
  p_now timestamptz,
  p_offer_minutes integer
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  booking_row public.phase_a_bookings;
  offer_round_number integer;
  inserted_count integer := 0;
  offer_seed text := gen_random_uuid()::text;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  if p_booking_id is null or p_now is null or p_slot is null or p_slot < 1 or p_slot > 4
    or p_offer_minutes is null or p_offer_minutes < 1 or p_offer_minutes > 1440 then
    raise exception 'invalid_no_show_offer_request' using errcode = '22023';
  end if;

  select b.* into booking_row
  from public.phase_a_bookings b
  where b.id = p_booking_id
  for update;
  if booking_row.id is null or p_slot > booking_row.helpers_needed
    or booking_row.status not in ('open', 'assigned', 'in_progress')
    or not exists (
      select 1 from public.booking_assignments a
      where a.booking_id = p_booking_id and a.slot = p_slot and a.status = 'no_show'
    )
    or exists (
      select 1 from public.booking_assignments a
      where a.booking_id = p_booking_id and a.slot = p_slot and a.status in ('accepted', 'completed')
    ) then
    raise exception 'no_show_slot_unavailable' using errcode = 'P0001';
  end if;

  select coalesce(max(o.offer_round), 1) + 1 into offer_round_number
  from public.booking_offers o
  where o.booking_id = p_booking_id and o.slot = p_slot;
  offer_round_number := greatest(offer_round_number, 2);

  insert into public.booking_offers (booking_id, helper_id, slot, offered_at, expires_at, offer_round)
  select booking_row.id, ranked.user_id, p_slot, p_now,
    p_now + make_interval(mins => p_offer_minutes), offer_round_number
  from (
    select h.user_id,
      row_number() over (
        order by
          (select count(*) from public.booking_assignments a
           where a.helper_id = h.user_id and a.status = 'completed'
             and a.accepted_at >= p_now - interval '30 days'),
          (select max(a.accepted_at) from public.booking_assignments a where a.helper_id = h.user_id) nulls first,
          case
            when booking_row.gender_pref = 'female' and h.gender_match_group = 'female' then 0
            when booking_row.gender_pref = 'male' and h.gender_match_group = 'male' then 0
            when booking_row.gender_pref = 'mix' and p_slot % 2 = 1 and h.gender_match_group = 'female' then 0
            when booking_row.gender_pref = 'mix' and p_slot % 2 = 0 and h.gender_match_group = 'male' then 0
            else 1
          end,
          md5(h.user_id::text || offer_seed)
      ) as helper_rank
    from public.helper_details h
    join public.profiles p on p.id = h.user_id and p.role = 'helper' and p.deleted_at is null
    where h.status = 'approved'
      and h.suburbs @> array[booking_row.suburb]
      and h.services @> booking_row.services
      and (h.first_job_completed_at is null or (h.subscription_status = 'active' and h.subscription_paid_until > p_now))
      and not exists (
        select 1 from public.booking_assignments a
        where a.booking_id = booking_row.id and a.helper_id = h.user_id
      )
      and not exists (
        select 1
        from public.booking_assignments a
        join public.phase_a_bookings occupied on occupied.id = a.booking_id
        where a.helper_id = h.user_id and a.status = 'accepted'
          and occupied.id <> booking_row.id
          and occupied.start_at < booking_row.end_at_est
          and occupied.end_at_est > booking_row.start_at
      )
  ) ranked
  where ranked.helper_rank <= 3
  order by ranked.helper_rank
  on conflict (booking_id, helper_id, slot, offer_round) do nothing;
  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.record_phase_a_helper_no_show(
  p_host_id uuid,
  p_booking_id uuid,
  p_helper_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  booking_row public.phase_a_bookings;
  assignment_row public.booking_assignments;
  helper_strikes integer;
  no_show_minutes integer;
  offer_minutes integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  if p_host_id is null or p_booking_id is null or p_helper_id is null then
    raise exception 'invalid_no_show_request' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = p_host_id and p.role = 'host' and p.deleted_at is null
  ) then
    raise exception 'booking_unavailable' using errcode = 'P0002';
  end if;

  select b.* into booking_row
  from public.phase_a_bookings b
  where b.id = p_booking_id and b.host_id = p_host_id
  for update;
  if booking_row.id is null or booking_row.status not in ('open', 'assigned', 'in_progress') then
    raise exception 'booking_unavailable' using errcode = 'P0002';
  end if;

  select a.* into assignment_row
  from public.booking_assignments a
  where a.booking_id = p_booking_id and a.helper_id = p_helper_id
  for update;
  if assignment_row.id is null then
    raise exception 'assignment_unavailable' using errcode = 'P0001';
  end if;
  if assignment_row.status = 'no_show' and assignment_row.no_show_at is not null then
    return assignment_row.id;
  end if;
  if assignment_row.status <> 'accepted' or assignment_row.checked_in_at is not null then
    raise exception 'no_show_not_allowed' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.profiles p
    join public.helper_details h on h.user_id = p.id
    where p.id = p_helper_id and p.role = 'helper' and p.deleted_at is null
  ) then
    raise exception 'assignment_unavailable' using errcode = 'P0001';
  end if;

  select case when jsonb_typeof(c.value) = 'number'
      and (c.value #>> '{}') ~ '^[1-9][0-9]*$'
      and (c.value #>> '{}')::numeric <= 2147483647
      then (c.value #>> '{}')::integer else null end
    into no_show_minutes
  from public.app_config c where c.key = 'no_show_minutes';
  select case when jsonb_typeof(c.value) = 'number'
      and (c.value #>> '{}') ~ '^[1-9][0-9]*$'
      and (c.value #>> '{}')::numeric <= 1440
      then (c.value #>> '{}')::integer else null end
    into offer_minutes
  from public.app_config c where c.key = 'offer_window_minutes';
  if no_show_minutes is null or offer_minutes is null then
    raise exception 'invalid_no_show_config' using errcode = '22023';
  end if;
  if now() < booking_row.start_at + make_interval(mins => no_show_minutes) then
    raise exception 'no_show_not_ready' using errcode = 'P0001';
  end if;

  select h.strikes into helper_strikes
  from public.helper_details h
  where h.user_id = p_helper_id
  for update;
  if helper_strikes is null then
    raise exception 'assignment_unavailable' using errcode = 'P0001';
  end if;

  update public.booking_assignments
  set status = 'no_show', no_show_at = now()
  where id = assignment_row.id and status = 'accepted' and checked_in_at is null;
  if not found then
    raise exception 'no_show_not_allowed' using errcode = 'P0001';
  end if;

  update public.helper_details
  set strikes = helper_strikes + 1, updated_at = now()
  where user_id = p_helper_id;

  if booking_row.status <> 'in_progress' then
    update public.phase_a_bookings
    set status = 'open', updated_at = now()
    where id = p_booking_id;
  end if;

  perform public.create_phase_a_no_show_offers(
    p_booking_id, assignment_row.slot, now(), offer_minutes
  );
  insert into public.phase_a_audit_log (actor_id, action, entity, entity_id)
  values (p_host_id, 'helper_no_show', 'booking_assignments', assignment_row.id);
  return assignment_row.id;
end;
$$;

create or replace function public.claim_phase_a_slot(p_booking_id uuid, p_helper_id uuid, p_slot integer)
returns public.booking_assignments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  booking_row public.phase_a_bookings;
  result public.booking_assignments;
  reopened_no_show_slot boolean;
  reopened_offer_round integer;
begin
  if p_booking_id is null or p_helper_id is null or p_slot is null or p_slot < 1 or p_slot > 4 then raise exception 'invalid_slot'; end if;
  select b.* into booking_row
  from public.phase_a_bookings b
  where b.id = p_booking_id
  for update;
  if booking_row.id is null then raise exception 'slot_unavailable'; end if;

  select exists (
    select 1 from public.booking_assignments a
    where a.booking_id = p_booking_id and a.slot = p_slot and a.status = 'no_show'
  ) and not exists (
    select 1 from public.booking_assignments a
    where a.booking_id = p_booking_id and a.slot = p_slot and a.status in ('accepted', 'completed')
  ) into reopened_no_show_slot;
  if booking_row.status not in ('open', 'assigned', 'in_progress')
    or (booking_row.status = 'in_progress' and not reopened_no_show_slot)
    or (booking_row.status <> 'in_progress' and p_slot > booking_row.helpers_needed)
    or (p_slot > booking_row.helpers_needed) then
    raise exception 'slot_unavailable';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_helper_id::text, 9042));
  if exists (
    select 1
    from public.booking_assignments a
    join public.phase_a_bookings occupied on occupied.id = a.booking_id
    where a.helper_id = p_helper_id and a.status = 'accepted' and occupied.id <> booking_row.id
      and occupied.start_at < booking_row.end_at_est and occupied.end_at_est > booking_row.start_at
  ) then
    raise exception 'slot_unavailable';
  end if;

  select max(o.offer_round) into reopened_offer_round
  from public.booking_offers o
  where o.booking_id = p_booking_id and o.slot = p_slot;

  insert into public.booking_assignments (booking_id, helper_id, slot)
  select booking_row.id, p_helper_id, p_slot
  from public.helper_details h
  join public.profiles p on p.id = h.user_id and p.role = 'helper' and p.deleted_at is null
  where h.user_id = p_helper_id
    and h.status = 'approved'
    and (h.first_job_completed_at is null or (h.subscription_status = 'active' and h.subscription_paid_until > now()))
    and h.services @> booking_row.services
    and h.suburbs @> array[booking_row.suburb]
    and not exists (select 1 from public.booking_assignments a where a.booking_id = booking_row.id and a.helper_id = p_helper_id)
    and (
      case when reopened_no_show_slot and reopened_offer_round > 1 then
        exists (select 1 from public.booking_offers o where o.booking_id = p_booking_id and o.helper_id = p_helper_id and o.slot = p_slot and o.offer_round = reopened_offer_round and o.expires_at > now())
        or coalesce((select min(o.expires_at) from public.booking_offers o where o.booking_id = p_booking_id and o.slot = p_slot and o.offer_round = reopened_offer_round), '-infinity'::timestamptz) <= now()
      else
        exists (select 1 from public.booking_offers o where o.booking_id = p_booking_id and o.helper_id = p_helper_id and o.slot = p_slot and o.expires_at > now())
        or coalesce((select min(o.expires_at) from public.booking_offers o where o.booking_id = p_booking_id), '-infinity'::timestamptz) <= now()
      end
    )
  returning * into result;
  if result.id is null then raise exception 'slot_unavailable'; end if;

  if booking_row.status <> 'in_progress' then
    update public.phase_a_bookings b
    set status = case when (select count(*) from public.booking_assignments a where a.booking_id = b.id and a.status = 'accepted') >= b.helpers_needed then 'assigned'::public.siza_booking_status else 'open'::public.siza_booking_status end,
        assigned_at = case when (select count(*) from public.booking_assignments a where a.booking_id = b.id and a.status = 'accepted') >= b.helpers_needed then coalesce(b.assigned_at, now()) else b.assigned_at end,
        updated_at = now()
    where b.id = booking_row.id;
  end if;
  return result;
end;
$$;

revoke execute on function public.create_phase_a_no_show_offers(uuid, integer, timestamptz, integer) from public, anon, authenticated;
grant execute on function public.create_phase_a_no_show_offers(uuid, integer, timestamptz, integer) to service_role;
revoke execute on function public.record_phase_a_helper_no_show(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.record_phase_a_helper_no_show(uuid, uuid, uuid) to service_role;
revoke execute on function public.claim_phase_a_slot(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_phase_a_slot(uuid, uuid, integer) to service_role;
