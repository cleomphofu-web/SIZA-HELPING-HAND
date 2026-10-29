-- Retention jobs: booking expiry, subscription lapse, orphan offer cleanup.
-- All functions are security definer, callable only by service_role.
-- Forward-only migration.

-- Expire open bookings whose offer window has passed with no full assignment.
create or replace function public.expire_open_bookings(
  p_now timestamptz default now()
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  expire_after_minutes integer;
  expired_count integer := 0;
  rec record;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'server_required' using errcode = '42501';
  end if;
  if p_now is null then
    raise exception 'invalid_time' using errcode = '22023';
  end if;

  -- Read offer window from app_config (minutes); bookings open longer than this are expired.
  select case
    when jsonb_typeof(c.value) = 'number' then (c.value #>> '{}')::integer
    else null
  end into expire_after_minutes
  from public.app_config c
  where c.key = 'offer_window_minutes';

  if expire_after_minutes is null or expire_after_minutes < 1 then
    raise exception 'expiry_config_unavailable' using errcode = '22023';
  end if;

  for rec in
    select b.id
    from public.phase_a_bookings b
    where b.status = 'open'
      and b.start_at + make_interval(mins => expire_after_minutes) <= p_now
    order by b.start_at, b.id
    for update of b skip locked
  loop
    update public.phase_a_bookings
    set status = 'expired',
        updated_at = p_now
    where id = rec.id
      and status = 'open';

    if found then
      expired_count := expired_count + 1;
    end if;
  end loop;

  return expired_count;
end;
$$;

revoke execute on function public.expire_open_bookings(timestamptz) from public, anon, authenticated;
grant execute on function public.expire_open_bookings(timestamptz) to service_role;

-- Lapse helpers whose subscription_paid_until has passed.
create or replace function public.lapse_expired_subscriptions(
  p_now timestamptz default now()
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  lapsed_count integer := 0;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'server_required' using errcode = '42501';
  end if;
  if p_now is null then
    raise exception 'invalid_time' using errcode = '22023';
  end if;

  update public.helper_details
  set subscription_status = 'lapsed',
      updated_at = p_now
  where subscription_status = 'active'
    and subscription_paid_until is not null
    and subscription_paid_until < p_now;

  get diagnostics lapsed_count = row_count;
  return lapsed_count;
end;
$$;

revoke execute on function public.lapse_expired_subscriptions(timestamptz) from public, anon, authenticated;
grant execute on function public.lapse_expired_subscriptions(timestamptz) to service_role;

-- Prune booking offers that are past their expires_at to keep the table compact.
create or replace function public.prune_expired_booking_offers(
  p_now timestamptz default now(),
  p_limit integer default 500
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  pruned integer := 0;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'server_required' using errcode = '42501';
  end if;
  if p_now is null then
    raise exception 'invalid_time' using errcode = '22023';
  end if;
  if p_limit < 1 or p_limit > 5000 then
    raise exception 'invalid_limit' using errcode = '22023';
  end if;

  with deleted as (
    delete from public.booking_offers
    where id in (
      select id from public.booking_offers
      where expires_at < p_now
      limit p_limit
    )
    returning id
  )
  select count(*) into pruned from deleted;

  return pruned;
end;
$$;

revoke execute on function public.prune_expired_booking_offers(timestamptz, integer) from public, anon, authenticated;
grant execute on function public.prune_expired_booking_offers(timestamptz, integer) to service_role;

