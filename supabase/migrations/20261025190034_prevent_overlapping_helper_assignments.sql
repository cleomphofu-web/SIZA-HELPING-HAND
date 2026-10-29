-- Keep offers and assignments from double-booking a helper in overlapping time windows.
-- Transaction advisory locks serialize assignment attempts for each helper across bookings.

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
            (select count(*) from public.booking_assignments a where a.helper_id = h.user_id and a.status = 'completed' and a.accepted_at >= now() - interval '30 days'),
            (select max(a.accepted_at) from public.booking_assignments a where a.helper_id = h.user_id) nulls first,
            case
              when booking_row.gender_pref = 'female' and h.gender_match_group = 'female' then 0
              when booking_row.gender_pref = 'male' and h.gender_match_group = 'male' then 0
              when booking_row.gender_pref = 'mix' and slot_number % 2 = 1 and h.gender_match_group = 'female' then 0
              when booking_row.gender_pref = 'mix' and slot_number % 2 = 0 and h.gender_match_group = 'male' then 0
              else 1
            end,
            md5(h.user_id::text || offer_seed)
        ) as helper_rank,
        count(*) over () as eligible_count
      from public.helper_details h
      join public.profiles p on p.id = h.user_id and p.role = 'helper'
      where h.status = 'approved'
        and h.suburbs @> array[booking_row.suburb]
        and h.services @> booking_row.services
        and not exists (select 1 from public.booking_assignments a where a.booking_id = booking_row.id and a.helper_id = h.user_id)
        and not exists (
          select 1
          from public.booking_assignments a
          join public.phase_a_bookings occupied on occupied.id = a.booking_id
          where a.helper_id = h.user_id
            and a.status = 'accepted'
            and occupied.id <> booking_row.id
            and occupied.start_at < booking_row.end_at_est
            and occupied.end_at_est > booking_row.start_at
        )
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

create or replace function public.claim_phase_a_slot(p_booking_id uuid, p_helper_id uuid, p_slot integer)
returns public.booking_assignments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  booking_row public.phase_a_bookings;
  result public.booking_assignments;
begin
  if p_slot < 1 or p_slot > 4 then raise exception 'invalid_slot'; end if;

  select b.* into booking_row
  from public.phase_a_bookings b
  where b.id = p_booking_id
  for update;
  if booking_row.id is null or booking_row.status not in ('open', 'assigned') then
    raise exception 'slot_unavailable';
  end if;

  -- Every claim, including claims for different bookings, uses this helper-scoped lock.
  perform pg_advisory_xact_lock(hashtextextended(p_helper_id::text, 9042));

  if exists (
    select 1
    from public.booking_assignments a
    join public.phase_a_bookings occupied on occupied.id = a.booking_id
    where a.helper_id = p_helper_id
      and a.status = 'accepted'
      and occupied.id <> booking_row.id
      and occupied.start_at < booking_row.end_at_est
      and occupied.end_at_est > booking_row.start_at
  ) then
    raise exception 'slot_unavailable';
  end if;

  insert into public.booking_assignments (booking_id, helper_id, slot)
  select booking_row.id, p_helper_id, p_slot
  from public.helper_details h
  join public.profiles p on p.id = h.user_id and p.role = 'helper'
  where h.user_id = p_helper_id
    and h.status = 'approved'
    and (h.first_job_completed_at is null or (h.subscription_status = 'active' and h.subscription_paid_until > now()))
    and h.services @> booking_row.services
    and h.suburbs @> array[booking_row.suburb]
    and p_slot <= booking_row.helpers_needed
    and (
      exists (select 1 from public.booking_offers o where o.booking_id = booking_row.id and o.helper_id = p_helper_id and o.slot = p_slot and o.expires_at > now())
      or coalesce((select min(o.expires_at) from public.booking_offers o where o.booking_id = booking_row.id), '-infinity'::timestamptz) <= now()
    )
    and not exists (select 1 from public.booking_assignments a where a.booking_id = booking_row.id and a.helper_id = p_helper_id)
  returning * into result;

  if result.id is null then raise exception 'slot_unavailable'; end if;

  update public.phase_a_bookings b
  set status = case when (select count(*) from public.booking_assignments a where a.booking_id = b.id and a.status = 'accepted') >= b.helpers_needed then 'assigned'::public.siza_booking_status else 'open'::public.siza_booking_status end,
      assigned_at = case when (select count(*) from public.booking_assignments a where a.booking_id = b.id and a.status = 'accepted') >= b.helpers_needed then coalesce(b.assigned_at, now()) else b.assigned_at end,
      updated_at = now()
  where b.id = booking_row.id;

  return result;
end;
$$;

create or replace function public.admin_assign_phase_a_helpers(
  p_actor_id uuid,
  p_booking_id uuid,
  p_helper_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  booking_row public.phase_a_bookings;
  helper_row public.helper_details;
  selected_helper_id uuid;
  slot_number integer;
  occupied_slot_count integer;
  accepted_count integer;
  requested_count integer;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'admin_required' using errcode = '42501';
  end if;
  if p_actor_id is null or not exists (
    select 1 from public.profiles p join public.admins a on a.user_id = p.id
    where p.id = p_actor_id and p.role = 'admin'
  ) then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  requested_count := coalesce(cardinality(p_helper_ids), 0);
  if requested_count < 1 or requested_count > 4
    or exists (select 1 from unnest(p_helper_ids) selected(id) where selected.id is null)
    or (select count(distinct selected.id) from unnest(p_helper_ids) selected(id)) <> requested_count then
    raise exception 'invalid_selection' using errcode = '22023';
  end if;

  select b.* into booking_row
  from public.phase_a_bookings b
  join public.profiles host_profile on host_profile.id = b.host_id and host_profile.role = 'host'
  where b.id = p_booking_id
  for update of b;
  if booking_row.id is null or booking_row.status not in ('open', 'assigned') then
    raise exception 'booking_unavailable' using errcode = 'P0002';
  end if;

  select count(*) into occupied_slot_count
  from public.booking_assignments a
  where a.booking_id = p_booking_id and a.status in ('accepted', 'completed');
  if requested_count > booking_row.helpers_needed - occupied_slot_count then
    raise exception 'insufficient_slots' using errcode = 'P0001';
  end if;

  -- Acquire helper locks in a stable order to avoid deadlocks for multi-helper assignment.
  for selected_helper_id in select distinct selected.id from unnest(p_helper_ids) selected(id) order by selected.id loop
    perform pg_advisory_xact_lock(hashtextextended(selected_helper_id::text, 9042));
  end loop;

  perform 1
  from public.helper_details h join public.profiles p on p.id = h.user_id
  where h.user_id = any(p_helper_ids)
  order by h.user_id
  for update of h, p;

  foreach selected_helper_id in array p_helper_ids loop
    select h.* into helper_row
    from public.helper_details h join public.profiles p on p.id = h.user_id
    where h.user_id = selected_helper_id
      and p.role = 'helper'
      and h.status = 'approved'
      and (h.first_job_completed_at is null or (h.subscription_status = 'active' and h.subscription_paid_until > now()))
      and h.services @> booking_row.services
      and h.suburbs @> array[booking_row.suburb];

    if helper_row.user_id is null
      or exists (select 1 from public.booking_assignments a where a.booking_id = p_booking_id and a.helper_id = selected_helper_id)
      or exists (
        select 1
        from public.booking_assignments a
        join public.phase_a_bookings occupied on occupied.id = a.booking_id
        where a.helper_id = selected_helper_id
          and a.status = 'accepted'
          and occupied.id <> booking_row.id
          and occupied.start_at < booking_row.end_at_est
          and occupied.end_at_est > booking_row.start_at
      ) then
      raise exception 'helper_unavailable' using errcode = 'P0001';
    end if;

    select free_slot.slot into slot_number
    from generate_series(1, booking_row.helpers_needed) as free_slot(slot)
    where not exists (
      select 1 from public.booking_assignments a
      where a.booking_id = p_booking_id and a.slot = free_slot.slot and a.status in ('accepted', 'completed')
    )
    order by free_slot.slot
    limit 1;
    if slot_number is null then raise exception 'insufficient_slots' using errcode = 'P0001'; end if;

    insert into public.booking_assignments (booking_id, helper_id, slot, status)
    values (p_booking_id, selected_helper_id, slot_number, 'accepted');
  end loop;

  select count(*) into accepted_count
  from public.booking_assignments a
  where a.booking_id = p_booking_id and a.status = 'accepted';
  update public.phase_a_bookings
  set status = case when accepted_count >= booking_row.helpers_needed then 'assigned'::public.siza_booking_status else 'open'::public.siza_booking_status end,
      assigned_at = case when accepted_count >= booking_row.helpers_needed then coalesce(assigned_at, now()) else assigned_at end,
      updated_at = now()
  where id = p_booking_id;

  insert into public.phase_a_audit_log (actor_id, action, entity, entity_id)
  values (p_actor_id, 'helpers_assigned', 'phase_a_bookings', p_booking_id);
  return requested_count;
end;
$$;

revoke execute on function public.create_phase_a_offers(uuid, integer) from public, anon, authenticated;
grant execute on function public.create_phase_a_offers(uuid, integer) to service_role;
revoke execute on function public.claim_phase_a_slot(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_phase_a_slot(uuid, uuid, integer) to service_role;
revoke execute on function public.admin_assign_phase_a_helpers(uuid, uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.admin_assign_phase_a_helpers(uuid, uuid, uuid[]) to service_role;
