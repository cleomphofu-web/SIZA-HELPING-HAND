-- Record check-in state, attempt lockout and attendance atomically.
-- Keep applied migrations, especially 0001, immutable.

insert into public.app_config (key, value)
values ('check_in_max_attempts', '5'::jsonb)
on conflict (key) do nothing;

revoke execute on function public.record_phase_a_code_attempt(uuid, timestamptz, boolean, integer)
  from public, anon, authenticated, service_role;
drop function public.record_phase_a_code_attempt(uuid, timestamptz, boolean, integer);

create function public.check_in_phase_a_booking(
  p_booking_id uuid,
  p_helper_id uuid,
  p_matches boolean,
  p_now timestamptz
)
returns table (accepted boolean, attempts integer, locked_until timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_booking public.phase_a_bookings;
  v_assignment public.booking_assignments;
  v_attempts integer;
  v_max_attempts integer;
  v_lock_minutes integer;
  v_new_lock timestamptz;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  if p_booking_id is null or p_helper_id is null or p_matches is null or p_now is null then
    raise exception 'invalid_check_in_request' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = p_helper_id and p.role = 'helper' and p.deleted_at is null
  ) then
    return query select false, 0, null::timestamptz;
    return;
  end if;

  select b.* into v_booking
  from public.phase_a_bookings b
  where b.id = p_booking_id
  for update;
  if not found then
    return query select false, 0, null::timestamptz;
    return;
  end if;

  select a.* into v_assignment
  from public.booking_assignments a
  where a.booking_id = p_booking_id and a.helper_id = p_helper_id
  for update;
  if not found or v_assignment.status <> 'accepted' then
    return query select false, coalesce(v_booking.code_attempts, 0), v_booking.code_locked_until;
    return;
  end if;
  if v_assignment.checked_in_at is not null then
    return query select true, coalesce(v_booking.code_attempts, 0), v_booking.code_locked_until;
    return;
  end if;
  if v_booking.status not in ('assigned', 'in_progress')
     or v_booking.check_in_code_hash is null
     or v_booking.check_in_code_expires_at is null
     or v_booking.check_in_code_expires_at <= p_now then
    return query select false, coalesce(v_booking.code_attempts, 0), v_booking.code_locked_until;
    return;
  end if;
  if v_booking.code_locked_until is not null and v_booking.code_locked_until > p_now then
    return query select false, v_booking.code_attempts, v_booking.code_locked_until;
    return;
  end if;

  v_attempts := case when v_booking.code_locked_until is not null then 0 else coalesce(v_booking.code_attempts, 0) end;
  if p_matches then
    update public.phase_a_bookings
    set code_attempts = 0,
        code_locked_until = null,
        status = 'in_progress',
        updated_at = p_now
    where id = p_booking_id;
    update public.booking_assignments
    set checked_in_at = coalesce(checked_in_at, p_now)
    where id = v_assignment.id;
    return query select true, 0, null::timestamptz;
    return;
  end if;

  select
    case when jsonb_typeof(c.value) = 'number'
      and (c.value #>> '{}') ~ '^[1-9][0-9]*$'
      and (c.value #>> '{}')::numeric <= 2147483647
      then (c.value #>> '{}')::integer else null end
  into v_max_attempts
  from public.app_config c where c.key = 'check_in_max_attempts';
  select
    case when jsonb_typeof(c.value) = 'number'
      and (c.value #>> '{}') ~ '^[1-9][0-9]*$'
      and (c.value #>> '{}')::numeric <= 2147483647
      then (c.value #>> '{}')::integer else null end
  into v_lock_minutes
  from public.app_config c where c.key = 'check_in_lock_minutes';
  if v_max_attempts is null or v_lock_minutes is null then
    raise exception 'invalid_check_in_config' using errcode = '22023';
  end if;

  v_attempts := v_attempts + 1;
  if v_attempts >= v_max_attempts then
    v_new_lock := p_now + make_interval(mins => v_lock_minutes);
  else
    v_new_lock := null;
  end if;
  update public.phase_a_bookings
  set code_attempts = v_attempts,
      code_locked_until = v_new_lock,
      updated_at = p_now
  where id = p_booking_id;

  if v_new_lock is not null and v_attempts = v_max_attempts then
    insert into public.phase_a_audit_log (actor_id, action, entity, entity_id)
    values (p_helper_id, 'check_in_code_locked', 'phase_a_bookings', p_booking_id);
  end if;
  return query select false, v_attempts, v_new_lock;
end;
$$;

revoke execute on function public.check_in_phase_a_booking(uuid, uuid, boolean, timestamptz)
  from public, anon, authenticated;
grant execute on function public.check_in_phase_a_booking(uuid, uuid, boolean, timestamptz)
  to service_role;
