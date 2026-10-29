-- Keep public slot visibility and atomic acceptance on the same booking-wide offer window.
-- Completed-job history stays available to its helper without re-reading current private contact details.

create or replace function public.claim_phase_a_slot(p_booking_id uuid, p_helper_id uuid, p_slot integer)
returns public.booking_assignments
language plpgsql
security definer
set search_path = public
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

  insert into public.booking_assignments (booking_id, helper_id, slot)
  select p_booking_id, p_helper_id, p_slot
  from public.helper_details h
  join public.profiles p on p.id = h.user_id and p.role = 'helper'
  where h.user_id = p_helper_id
    and h.status = 'approved'
    and (h.first_job_completed_at is null or (h.subscription_status = 'active' and h.subscription_paid_until > now()))
    and h.services && booking_row.services
    and h.suburbs @> array[booking_row.suburb]
    and p_slot <= booking_row.helpers_needed
    and (
      exists (select 1 from public.booking_offers o where o.booking_id = p_booking_id and o.helper_id = p_helper_id and o.slot = p_slot and o.expires_at > now())
      or coalesce((select min(o.expires_at) from public.booking_offers o where o.booking_id = p_booking_id), '-infinity'::timestamptz) <= now()
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

revoke execute on function public.claim_phase_a_slot(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_phase_a_slot(uuid, uuid, integer) to service_role;
