-- Optional self-described matching category affects offer order only.
-- Applied migrations, including 0001, remain immutable.

alter table public.helper_details
  add column gender_match_group text,
  add column gender_match_consent_at timestamptz,
  add column gender_match_consent_version text,
  add constraint helper_gender_match_group_allowed
    check (gender_match_group is null or gender_match_group in ('female', 'male')),
  add constraint helper_gender_match_consent_complete
    check (
      (gender_match_group is null and gender_match_consent_at is null and gender_match_consent_version is null)
      or (gender_match_group is not null and gender_match_consent_at is not null and gender_match_consent_version = 'gender_matching_v1')
    );

create or replace function public.set_helper_gender_match_preference(
  p_helper_id uuid,
  p_gender_match_group text,
  p_consent_version text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  changed integer;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  if p_helper_id is null or not exists (
    select 1 from public.profiles p where p.id = p_helper_id and p.role = 'helper'
  ) then
    raise exception 'helper_required' using errcode = '42501';
  end if;
  if (p_gender_match_group is not null and p_gender_match_group not in ('female', 'male'))
    or (p_gender_match_group is null and p_consent_version is not null)
    or (p_gender_match_group is not null and p_consent_version is distinct from 'gender_matching_v1') then
    raise exception 'invalid_gender_match_preference' using errcode = '22023';
  end if;

  update public.helper_details
  set gender_match_group = p_gender_match_group,
      gender_match_consent_at = case when p_gender_match_group is null then null else now() end,
      gender_match_consent_version = p_consent_version,
      updated_at = now()
  where user_id = p_helper_id;
  get diagnostics changed = row_count;
  if changed = 0 then raise exception 'helper_profile_required' using errcode = 'P0002'; end if;
  return true;
end;
$$;

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
  offer_seed text := gen_random_uuid()::text;
begin
  if p_offer_minutes < 1 or p_offer_minutes > 1440 then
    raise exception 'invalid_offer_window' using errcode = '22023';
  end if;

  select * into booking_row
  from public.phase_a_bookings
  where id = p_booking_id and status = 'open'
  for update;
  if booking_row.id is null then return 0; end if;

  if exists (select 1 from public.booking_offers o where o.booking_id = booking_row.id)
    and not exists (
      select 1
      from generate_series(1, booking_row.helpers_needed) as requested_slot(slot)
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
            (select count(*) from public.booking_assignments a where a.helper_id = h.user_id and a.accepted_at >= now() - interval '30 days'),
            (select max(a.accepted_at) from public.booking_assignments a where a.helper_id = h.user_id),
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
      join public.profiles p on p.id = h.user_id and p.role = 'helper'
      where h.status = 'approved'
        and h.suburbs @> array[booking_row.suburb]
        and h.services @> booking_row.services
        and not exists (select 1 from public.booking_assignments a where a.booking_id = booking_row.id and a.helper_id = h.user_id)
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

revoke all on function public.set_helper_gender_match_preference(uuid, text, text) from public, anon, authenticated;
grant execute on function public.set_helper_gender_match_preference(uuid, text, text) to service_role;
revoke execute on function public.create_phase_a_offers(uuid, integer) from public, anon, authenticated;
grant execute on function public.create_phase_a_offers(uuid, integer) to service_role;
