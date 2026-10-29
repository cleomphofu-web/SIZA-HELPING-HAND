-- Forward-fix a PL/pgSQL variable/column ambiguity found by local integration tests.
-- Keep 0001-0009 immutable after application.

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
    select 1
    from public.profiles p
    join public.admins a on a.user_id = p.id
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

  select * into booking_row
  from public.phase_a_bookings
  where id = p_booking_id
  for update;
  if booking_row.id is null or booking_row.status not in ('open', 'assigned') then
    raise exception 'booking_unavailable' using errcode = 'P0002';
  end if;

  select count(*) into occupied_slot_count
  from public.booking_assignments a
  where a.booking_id = p_booking_id;
  if requested_count > booking_row.helpers_needed - occupied_slot_count then
    raise exception 'insufficient_slots' using errcode = 'P0001';
  end if;

  perform 1
  from public.helper_details h
  join public.profiles p on p.id = h.user_id
  where h.user_id = any(p_helper_ids)
  order by h.user_id
  for update of h, p;

  foreach selected_helper_id in array p_helper_ids loop
    select h.* into helper_row
    from public.helper_details h
    join public.profiles p on p.id = h.user_id
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
      where a.booking_id = p_booking_id and a.slot = free_slot.slot
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

revoke execute on function public.admin_assign_phase_a_helpers(uuid, uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.admin_assign_phase_a_helpers(uuid, uuid, uuid[]) to service_role;
