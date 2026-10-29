-- Phase A follow-up: correct enum assignment and remove PL/pgSQL shadowing.
-- 0001, 0002 and 0003 are applied migration history and remain immutable.

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

create or replace function public.create_phase_a_offers(p_booking_id uuid, p_offer_minutes integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  booking_row public.phase_a_bookings;
  inserted_count integer := 0;
  row_count integer := 0;
begin
  if p_offer_minutes < 1 or p_offer_minutes > 1440 then raise exception 'invalid_offer_window'; end if;
  select * into booking_row from public.phase_a_bookings where id = p_booking_id and status = 'open';
  if booking_row.id is null then return 0; end if;
  for v_slot_number in 1..booking_row.helpers_needed loop
    insert into public.booking_offers (booking_id, helper_id, slot, offered_at, expires_at)
    select booking_row.id, h.user_id, v_slot_number, now(), now() + make_interval(mins => p_offer_minutes)
    from public.helper_details h
    where h.status = 'approved'
      and h.suburbs @> array[booking_row.suburb]
      and h.services && booking_row.services
      and not exists (select 1 from public.booking_assignments a where a.booking_id = booking_row.id and a.helper_id = h.user_id)
      and (h.first_job_completed_at is null or (h.subscription_status = 'active' and h.subscription_paid_until > now()))
    order by
      (select count(*) from public.booking_assignments a where a.helper_id = h.user_id and a.accepted_at >= now() - interval '30 days'),
      (select max(a.accepted_at) from public.booking_assignments a where a.helper_id = h.user_id),
      random()
    limit 3
    on conflict do nothing;
    get diagnostics row_count = ROW_COUNT;
    inserted_count := inserted_count + row_count;
  end loop;
  return inserted_count;
end;
$$;
