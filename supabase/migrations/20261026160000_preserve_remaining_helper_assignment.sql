-- The existing no-show transaction reopens the vacant slot by setting the
-- booking to open. Keep the aggregate booking in assigned state when other
-- helpers still own active slots so their host/helper check-in screens remain.

create or replace function public.record_phase_a_helper_no_show_with_assignment_state(
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
  assignment_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;

  assignment_id := public.record_phase_a_helper_no_show(p_host_id, p_booking_id, p_helper_id);

  update public.phase_a_bookings b
  set status = 'assigned', updated_at = now()
  where b.id = p_booking_id
    and b.host_id = p_host_id
    and b.status = 'open'
    and exists (
      select 1 from public.booking_assignments a
      where a.booking_id = b.id and a.status = 'accepted'
    );

  return assignment_id;
end;
$$;

revoke execute on function public.record_phase_a_helper_no_show_with_assignment_state(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.record_phase_a_helper_no_show_with_assignment_state(uuid, uuid, uuid) to service_role;
