-- Use the database clock for presenting the host's 60-minute resolution choice.

create or replace function public.get_phase_a_host_no_show_slots(p_host_id uuid, p_booking_id uuid)
returns table (
  slot integer,
  no_show_at timestamptz,
  resolution text,
  recovery_minutes integer,
  can_resolve boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  booking_row public.phase_a_bookings;
  recovery_interval integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  select b.* into booking_row
  from public.phase_a_bookings b
  join public.profiles p on p.id = b.host_id and p.role = 'host' and p.deleted_at is null
  where b.id = p_booking_id and b.host_id = p_host_id;
  if booking_row.id is null then
    raise exception 'booking_not_found' using errcode = 'P0002';
  end if;

  select case when jsonb_typeof(c.value) = 'number'
      and (c.value #>> '{}') ~ '^[1-9][0-9]*$'
      and (c.value #>> '{}')::numeric <= 10080
      then (c.value #>> '{}')::integer else null end
    into recovery_interval
  from public.app_config c where c.key = 'no_show_recovery_minutes';
  if recovery_interval is null then
    raise exception 'invalid_no_show_recovery_config' using errcode = '22023';
  end if;

  return query
  select latest.slot, latest.no_show_at, latest.no_show_resolution, recovery_interval,
    latest.no_show_resolution is null
      and latest.no_show_at + make_interval(mins => recovery_interval) <= now()
      and booking_row.status in ('open', 'assigned', 'in_progress')
      and not exists (
        select 1 from public.booking_assignments active
        where active.booking_id = p_booking_id and active.slot = latest.slot and active.status in ('accepted', 'completed')
      ) as can_resolve
  from (
    select distinct on (a.slot) a.slot, a.no_show_at, a.no_show_resolution
    from public.booking_assignments a
    where a.booking_id = p_booking_id and a.status = 'no_show'
    order by a.slot, a.no_show_at desc nulls last, a.created_at desc
  ) latest
  order by latest.slot;
end;
$$;

revoke execute on function public.get_phase_a_host_no_show_slots(uuid, uuid) from public, anon, authenticated;
grant execute on function public.get_phase_a_host_no_show_slots(uuid, uuid) to service_role;
