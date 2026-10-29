-- Require a complete active assignment set before auto-release. No-show history
-- may remain on the booking, but every requested slot must have a current helper.

create or replace function public.auto_release_phase_a_bookings(
  p_now timestamptz default now()
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  release_hours integer;
  booking_row public.phase_a_bookings%rowtype;
  completed_assignments integer;
  completed_bookings integer;
  released_count integer := 0;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'server_required' using errcode = '42501';
  end if;

  if p_now is null then
    raise exception 'invalid_release_time' using errcode = '22023';
  end if;

  select case
    when jsonb_typeof(c.value) = 'number' then (c.value #>> '{}')::integer
    else null
  end into release_hours
  from public.app_config c
  where c.key = 'auto_release_hours';

  if release_hours is null or release_hours < 1 then
    raise exception 'auto_release_config_unavailable' using errcode = '22023';
  end if;

  for booking_row in
    select b.*
    from public.phase_a_bookings b
    where b.status = 'in_progress'
      and b.end_at_est + make_interval(hours => release_hours) <= p_now
      and (select count(*) from public.booking_assignments a where a.booking_id = b.id and a.status = 'accepted') = b.helpers_needed
      and not exists (
        select 1 from public.booking_assignments a
        where a.booking_id = b.id
          and a.status = 'accepted'
          and a.checked_in_at is null
      )
      and not exists (
        select 1 from public.booking_assignments a
        where a.booking_id = b.id and a.host_confirmed_at is not null
      )
      and not exists (
        select 1 from public.phase_a_reports r
        where r.booking_id = b.id and r.status in ('open', 'reviewing')
      )
    order by b.end_at_est, b.id
    for update of b skip locked
  loop
    -- Re-evaluate after row lock acquisition with a fresh READ COMMITTED snapshot.
    -- Report creation also locks this booking before inserting its row.
    if exists (
      select 1 from public.phase_a_reports r
      where r.booking_id = booking_row.id and r.status in ('open', 'reviewing')
    ) or (select count(*) from public.booking_assignments a where a.booking_id = booking_row.id and a.status = 'accepted') <> booking_row.helpers_needed
      or exists (
        select 1 from public.booking_assignments a
        where a.booking_id = booking_row.id
          and a.status = 'accepted'
          and a.checked_in_at is null
      ) or exists (
        select 1 from public.booking_assignments a
        where a.booking_id = booking_row.id and a.host_confirmed_at is not null
      ) then
      continue;
    end if;

    update public.booking_assignments a
    set status = 'completed'
    where a.booking_id = booking_row.id
      and a.status = 'accepted'
      and a.checked_in_at is not null;
    get diagnostics completed_assignments = row_count;

    if completed_assignments <> booking_row.helpers_needed then
      raise exception 'auto_release_assignments_changed' using errcode = 'P0001';
    end if;

    update public.phase_a_bookings b
    set status = 'completed',
        completed_at = coalesce(b.completed_at, p_now),
        updated_at = p_now
    where b.id = booking_row.id
      and b.status = 'in_progress';
    get diagnostics completed_bookings = row_count;

    if completed_bookings <> 1 then
      raise exception 'auto_release_state_changed' using errcode = 'P0001';
    end if;

    update public.helper_details h
    set first_job_completed_at = coalesce(h.first_job_completed_at, p_now)
    where h.user_id in (
      select a.helper_id
      from public.booking_assignments a
      where a.booking_id = booking_row.id and a.status = 'completed'
    );

    released_count := released_count + 1;
  end loop;

  return released_count;
end;
$$;

revoke execute on function public.auto_release_phase_a_bookings(timestamptz) from public, anon, authenticated;
grant execute on function public.auto_release_phase_a_bookings(timestamptz) to service_role;
