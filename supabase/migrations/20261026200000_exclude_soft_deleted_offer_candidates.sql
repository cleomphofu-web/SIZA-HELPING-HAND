-- Do not spend rotation offers on accounts that atomic acceptance rejects.

create or replace function public.create_phase_a_offers(p_booking_id uuid, p_offer_minutes integer)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  booking_row public.phase_a_bookings;
  slot_number integer;
  inserted_count integer := 0;
  row_count integer := 0;
  rotation_lookback_days integer;
  offer_seed text := gen_random_uuid()::text;
begin
  if p_offer_minutes < 1 or p_offer_minutes > 1440 then
    raise exception 'invalid_offer_window' using errcode = '22023';
  end if;
  select case when jsonb_typeof(c.value) = 'number'
      and (c.value #>> '{}') ~ '^[1-9][0-9]*$'
      and (c.value #>> '{}')::numeric <= 3650
      then (c.value #>> '{}')::integer else null end
    into rotation_lookback_days
  from public.app_config c where c.key = 'rotation_lookback_days';
  if rotation_lookback_days is null then
    raise exception 'invalid_rotation_lookback_config' using errcode = '22023';
  end if;

  select * into booking_row
  from public.phase_a_bookings
  where id = p_booking_id and status = 'open'
  for update;
  if booking_row.id is null then return 0; end if;

  if exists (select 1 from public.booking_offers o where o.booking_id = booking_row.id)
    and not exists (
      select 1 from generate_series(1, booking_row.helpers_needed) as requested_slot(slot)
      where (select count(*) from public.booking_offers o where o.booking_id = booking_row.id and o.slot = requested_slot.slot) < 3
    ) then
    return 0;
  end if;

  for slot_number in 1..booking_row.helpers_needed loop
    insert into public.booking_offers (booking_id, helper_id, slot, offered_at, expires_at)
    select booking_row.id, ranked.user_id, slot_number, now(), now() + make_interval(mins => p_offer_minutes)
    from (
      select h.user_id,
        row_number() over (
          order by
            (select count(*) from public.booking_assignments a
             where a.helper_id = h.user_id and a.status = 'completed'
               and a.accepted_at >= now() - make_interval(days => rotation_lookback_days)),
            (select max(a.accepted_at) from public.booking_assignments a where a.helper_id = h.user_id) nulls first,
            case
              when booking_row.gender_pref = 'female' and h.gender_match_group = 'female' then 0
              when booking_row.gender_pref = 'male' and h.gender_match_group = 'male' then 0
              when booking_row.gender_pref = 'mix' and slot_number % 2 = 1 and h.gender_match_group = 'female' then 0
              when booking_row.gender_pref = 'mix' and slot_number % 2 = 0 and h.gender_match_group = 'male' then 0
              else 1
            end,
            md5(h.user_id::text || offer_seed)
        ) as helper_rank,
        count(*) over () as eligible_count
      from public.helper_details h
      join public.profiles p on p.id = h.user_id and p.role = 'helper' and p.deleted_at is null
      where h.status = 'approved'
        and h.suburbs @> array[booking_row.suburb]
        and h.services @> booking_row.services
        and not exists (select 1 from public.booking_assignments a where a.booking_id = booking_row.id and a.helper_id = h.user_id)
        and not exists (
          select 1
          from public.booking_assignments a
          join public.phase_a_bookings occupied on occupied.id = a.booking_id
          where a.helper_id = h.user_id and a.status = 'accepted'
            and occupied.id <> booking_row.id
            and occupied.start_at < booking_row.end_at_est
            and occupied.end_at_est > booking_row.start_at
        )
        and (h.first_job_completed_at is null or (h.subscription_status = 'active' and h.subscription_paid_until > now()))
    ) ranked
    where ((ranked.helper_rank - 1 + slot_number - 1) % ranked.eligible_count) < 3
    order by ((ranked.helper_rank - 1 + slot_number - 1) % ranked.eligible_count)
    limit 3
    on conflict do nothing;
    get diagnostics row_count = ROW_COUNT;
    inserted_count := inserted_count + row_count;
  end loop;
  return inserted_count;
end;
$$;
