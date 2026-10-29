-- Record the host's decision after the no-show recovery interval.
-- A resolution closes only this vacancy; other helper assignments are preserved.

alter table public.booking_assignments
  add column no_show_resolution text,
  add column no_show_resolved_at timestamptz,
  add constraint booking_assignments_no_show_resolution_check
    check (no_show_resolution is null or no_show_resolution in ('proceed_fewer', 'close_vacant_slot')),
  add constraint booking_assignments_no_show_resolution_timestamp_check
    check ((no_show_resolution is null) = (no_show_resolved_at is null)),
  add constraint booking_assignments_no_show_resolution_status_check
    check (no_show_resolution is null or status = 'no_show');

create or replace function public.prevent_closed_no_show_slot_claim()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1 from public.booking_assignments a
    where a.booking_id = new.booking_id and a.slot = new.slot
      and a.status = 'no_show' and a.no_show_resolution is not null
  ) then
    raise exception 'slot_closed' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.prevent_closed_no_show_slot_claim() from public, anon, authenticated;

create trigger prevent_closed_no_show_slot_claim
before insert on public.booking_assignments
for each row execute function public.prevent_closed_no_show_slot_claim();

create or replace function public.resolve_phase_a_no_show_slot(
  p_host_id uuid,
  p_booking_id uuid,
  p_slot integer,
  p_resolution text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  booking_row public.phase_a_bookings;
  assignment_row public.booking_assignments;
  recovery_minutes integer;
  remaining_assignments integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  if p_host_id is null or p_booking_id is null or p_slot is null or p_slot < 1 or p_slot > 4
    or p_resolution not in ('proceed_fewer', 'close_vacant_slot') then
    raise exception 'invalid_no_show_resolution' using errcode = '22023';
  end if;

  select b.* into booking_row
  from public.phase_a_bookings b
  join public.profiles p on p.id = b.host_id and p.role = 'host' and p.deleted_at is null
  where b.id = p_booking_id and b.host_id = p_host_id
  for update of b;
  if booking_row.id is null then
    raise exception 'booking_not_found' using errcode = 'P0002';
  end if;
  if p_slot > booking_row.helpers_needed or booking_row.status not in ('open', 'assigned', 'in_progress') then
    raise exception 'no_show_slot_unavailable' using errcode = 'P0001';
  end if;

  select case when jsonb_typeof(c.value) = 'number'
      and (c.value #>> '{}') ~ '^[1-9][0-9]*$'
      and (c.value #>> '{}')::numeric <= 10080
      then (c.value #>> '{}')::integer else null end
    into recovery_minutes
  from public.app_config c where c.key = 'no_show_recovery_minutes';
  if recovery_minutes is null then
    raise exception 'invalid_no_show_recovery_config' using errcode = '22023';
  end if;

  select a.* into assignment_row
  from public.booking_assignments a
  where a.booking_id = p_booking_id and a.slot = p_slot and a.status = 'no_show'
  order by a.no_show_at desc nulls last, a.created_at desc
  limit 1
  for update;
  if assignment_row.id is null or assignment_row.no_show_at is null then
    raise exception 'no_show_slot_unavailable' using errcode = 'P0001';
  end if;
  if assignment_row.no_show_resolution is not null then
    if assignment_row.no_show_resolution = p_resolution then return assignment_row.id; end if;
    raise exception 'no_show_slot_already_resolved' using errcode = 'P0001';
  end if;
  if now() < assignment_row.no_show_at + make_interval(mins => recovery_minutes) then
    raise exception 'no_show_recovery_pending' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.booking_assignments a
    where a.booking_id = p_booking_id and a.slot = p_slot and a.status in ('accepted', 'completed')
  ) then
    raise exception 'no_show_slot_filled' using errcode = 'P0001';
  end if;

  select count(*) into remaining_assignments
  from public.booking_assignments a
  where a.booking_id = p_booking_id and a.status in ('accepted', 'completed');
  if p_resolution = 'proceed_fewer' and remaining_assignments = 0 then
    raise exception 'no_remaining_helpers' using errcode = 'P0001';
  end if;

  update public.booking_assignments
  set no_show_resolution = p_resolution, no_show_resolved_at = now()
  where id = assignment_row.id and no_show_resolution is null;
  if not found then
    raise exception 'no_show_slot_already_resolved' using errcode = 'P0001';
  end if;

  if p_resolution = 'close_vacant_slot' and remaining_assignments = 0 then
    update public.phase_a_bookings set status = 'cancelled', updated_at = now() where id = p_booking_id;
  end if;

  insert into public.phase_a_audit_log (actor_id, action, entity, entity_id)
  values (p_host_id, 'helper_no_show_slot_resolved', 'booking_assignments', assignment_row.id);
  return assignment_row.id;
end;
$$;

revoke execute on function public.resolve_phase_a_no_show_slot(uuid, uuid, integer, text) from public, anon, authenticated;
grant execute on function public.resolve_phase_a_no_show_slot(uuid, uuid, integer, text) to service_role;
