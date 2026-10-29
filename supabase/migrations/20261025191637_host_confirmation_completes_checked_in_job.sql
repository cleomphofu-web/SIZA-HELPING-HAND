-- Align atomic completion with spec 6.7: host confirmation plus recorded check-in
-- counts the first completed job. Helper confirmation alone does not complete it.
-- Auto-release remains a separate scheduled job.

create or replace function public.confirm_phase_a_booking(
  p_actor_id uuid,
  p_actor_role text,
  p_booking_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  booking_row public.phase_a_bookings%rowtype;
  changed_count integer;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'server_required' using errcode = '42501';
  end if;

  if p_actor_id is null
    or p_actor_role not in ('host', 'helper')
    or not exists (
      select 1 from public.profiles p
      where p.id = p_actor_id and p.role::text = p_actor_role
    ) then
    raise exception 'participant_required' using errcode = '42501';
  end if;

  select b.* into booking_row
  from public.phase_a_bookings b
  where b.id = p_booking_id
  for update;

  if booking_row.id is null
    or (p_actor_role = 'host' and booking_row.host_id <> p_actor_id)
    or (p_actor_role = 'helper' and not exists (
      select 1 from public.booking_assignments a
      where a.booking_id = p_booking_id
        and a.helper_id = p_actor_id
        and a.status in ('accepted', 'completed')
    )) then
    raise exception 'booking_unavailable' using errcode = 'P0002';
  end if;

  if booking_row.status not in ('in_progress', 'completed') then
    raise exception 'booking_not_in_progress' using errcode = 'P0001';
  end if;

  if p_actor_role = 'host' then
    update public.booking_assignments a
    set host_confirmed_at = coalesce(a.host_confirmed_at, now())
    where a.booking_id = p_booking_id
      and a.status in ('accepted', 'completed');
  else
    update public.booking_assignments a
    set helper_confirmed_at = coalesce(a.helper_confirmed_at, now())
    where a.booking_id = p_booking_id
      and a.helper_id = p_actor_id
      and a.status in ('accepted', 'completed');
  end if;
  get diagnostics changed_count = row_count;

  if changed_count = 0 then
    raise exception 'booking_unavailable' using errcode = 'P0002';
  end if;

  -- The host confirms the booking as a whole. Every assigned helper must have
  -- checked in first; helper confirmation is independent and does not block
  -- the host's completion confirmation.
  if p_actor_role = 'host' and booking_row.status = 'in_progress' then
    if not exists (
      select 1 from public.booking_assignments a
      where a.booking_id = p_booking_id and a.status = 'accepted'
    ) or exists (
      select 1 from public.booking_assignments a
      where a.booking_id = p_booking_id
        and a.status = 'accepted'
        and a.checked_in_at is null
    ) then
      raise exception 'check_in_required' using errcode = 'P0001';
    end if;

    update public.booking_assignments a
    set status = 'completed'
    where a.booking_id = p_booking_id and a.status = 'accepted';

    update public.phase_a_bookings b
    set status = 'completed',
        completed_at = coalesce(b.completed_at, now()),
        updated_at = now()
    where b.id = p_booking_id and b.status = 'in_progress';

    update public.helper_details h
    set first_job_completed_at = coalesce(h.first_job_completed_at, now())
    where h.user_id in (
      select a.helper_id from public.booking_assignments a
      where a.booking_id = p_booking_id and a.status = 'completed'
    );
  end if;

  return true;
end;
$$;

revoke execute on function public.confirm_phase_a_booking(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.confirm_phase_a_booking(uuid, text, uuid) to service_role;
