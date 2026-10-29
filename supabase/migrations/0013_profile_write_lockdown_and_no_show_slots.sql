-- Lock security-sensitive profile fields behind server-only services and allow
-- a reopened no-show slot to receive a replacement without deleting history.
-- Previously applied migrations, including 0001_init.sql, remain immutable.

revoke insert, update, delete on table public.profiles, public.helper_details from authenticated;
grant select on table public.profiles, public.helper_details to authenticated;

alter table public.booking_assignments
  drop constraint booking_assignments_booking_id_slot_key;

create unique index booking_assignments_active_booking_slot_key
  on public.booking_assignments (booking_id, slot)
  where status in ('accepted', 'completed');

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
  join public.profiles p on p.id = h.user_id and p.role = 'helper'
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
  set status = case when (select count(*) from public.booking_assignments a where a.booking_id = b.id and a.status = 'accepted') >= b.helpers_needed then 'assigned'::public.siza_booking_status else 'open'::public.siza_booking_status end,
      assigned_at = case when (select count(*) from public.booking_assignments a where a.booking_id = b.id and a.status = 'accepted') >= b.helpers_needed then coalesce(b.assigned_at, now()) else b.assigned_at end,
      updated_at = now()
  where b.id = p_booking_id;
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
      and h.services && booking_row.services
      and h.suburbs @> array[booking_row.suburb];

    if helper_row.user_id is null or exists (
      select 1 from public.booking_assignments a
      where a.booking_id = p_booking_id and a.helper_id = selected_helper_id
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
    if slot_number is null then
      raise exception 'insufficient_slots' using errcode = 'P0001';
    end if;

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

revoke execute on function public.claim_phase_a_slot(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_phase_a_slot(uuid, uuid, integer) to service_role;
revoke execute on function public.admin_assign_phase_a_helpers(uuid, uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.admin_assign_phase_a_helpers(uuid, uuid, uuid[]) to service_role;
