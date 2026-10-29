-- Replace the launch rate-limit vendor with short-lived Postgres counters.
-- Counter subjects are keyed HMACs created in the server; raw IPs and emails are never stored.

create table public.rate_limit_counters (
  bucket text not null,
  subject_hash text not null check (subject_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  window_expires_at timestamptz not null,
  attempt_count integer not null check (attempt_count > 0),
  primary key (bucket, subject_hash),
  constraint rate_limit_bucket_known check (bucket in (
    'booking', 'apply', 'upload', 'login', 'accept', 'report', 'code_attempt', 'admin_action',
    'login_pair', 'login_account'
  )),
  constraint rate_limit_window_order check (window_expires_at > window_started_at)
);

create index rate_limit_counters_expiry_idx on public.rate_limit_counters(window_expires_at);
alter table public.rate_limit_counters enable row level security;
revoke all on public.rate_limit_counters from public, anon, authenticated;
grant select, delete on public.rate_limit_counters to service_role;

insert into public.app_config(key, value) values
  ('rate_limit_booking', '{"limit":10,"window_seconds":3600}'::jsonb),
  ('rate_limit_apply', '{"limit":5,"window_seconds":3600}'::jsonb),
  ('rate_limit_upload', '{"limit":30,"window_seconds":3600}'::jsonb),
  ('rate_limit_login', '{"limit":5,"window_seconds":900}'::jsonb),
  ('rate_limit_accept', '{"limit":20,"window_seconds":3600}'::jsonb),
  ('rate_limit_report', '{"limit":10,"window_seconds":3600}'::jsonb),
  ('rate_limit_code_attempt', '{"limit":5,"window_seconds":900}'::jsonb),
  ('rate_limit_admin_action', '{"limit":60,"window_seconds":3600}'::jsonb),
  ('rate_limit_login_pair', '{"limit":5,"window_seconds":900}'::jsonb),
  ('rate_limit_login_account', '{"limit":20,"window_seconds":3600}'::jsonb)
on conflict (key) do nothing;

create or replace function public.bump_rate_limit_counter(
  p_bucket text,
  p_subject_hash text,
  p_window_seconds integer,
  p_now timestamptz default now()
)
returns table(attempt_count integer, window_expires_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_subject_hash !~ '^[0-9a-f]{64}$' or p_window_seconds not between 1 and 86400 then
    raise exception 'invalid_rate_limit_input' using errcode = '22023';
  end if;

  return query
  insert into public.rate_limit_counters as current_window(
    bucket, subject_hash, window_started_at, window_expires_at, attempt_count
  ) values (
    p_bucket, p_subject_hash, p_now, p_now + make_interval(secs => p_window_seconds), 1
  )
  on conflict (bucket, subject_hash) do update set
    window_started_at = case when current_window.window_expires_at <= p_now then p_now else current_window.window_started_at end,
    window_expires_at = case when current_window.window_expires_at <= p_now then p_now + make_interval(secs => p_window_seconds) else current_window.window_expires_at end,
    attempt_count = case when current_window.window_expires_at <= p_now then 1 else current_window.attempt_count + 1 end
  returning current_window.attempt_count, current_window.window_expires_at;
end;
$$;

create or replace function public.consume_rate_limit(p_bucket text, p_subject_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit integer;
  v_seconds integer;
  v_count integer;
  v_expires timestamptz;
begin
  if p_bucket not in ('booking', 'apply', 'upload', 'login', 'accept', 'report', 'code_attempt', 'admin_action') then
    raise exception 'unknown_rate_limit_bucket' using errcode = '22023';
  end if;

  select (value->>'limit')::integer, (value->>'window_seconds')::integer
    into v_limit, v_seconds
  from public.app_config where key = 'rate_limit_' || p_bucket;
  if v_limit is null or v_limit < 1 or v_seconds is null or v_seconds not between 1 and 86400 then
    raise exception 'rate_limit_not_configured' using errcode = '22023';
  end if;

  select counter.attempt_count, counter.window_expires_at into v_count, v_expires
  from public.bump_rate_limit_counter(p_bucket, p_subject_hash, v_seconds) counter;
  return jsonb_build_object(
    'allowed', v_count <= v_limit,
    'retry_after_seconds', greatest(1, ceil(extract(epoch from (v_expires - now())))::integer)
  );
end;
$$;

create or replace function public.login_throttle_status(p_account_hash text, p_pair_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pair_limit integer;
  v_pair_seconds integer;
  v_account_limit integer;
  v_account_seconds integer;
  v_pair_count integer := 0;
  v_pair_expires timestamptz;
  v_account_count integer := 0;
  v_account_expires timestamptz;
  v_now timestamptz := now();
begin
  if p_account_hash !~ '^[0-9a-f]{64}$' or p_pair_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_login_limit_input' using errcode = '22023';
  end if;
  select (value->>'limit')::integer, (value->>'window_seconds')::integer into v_pair_limit, v_pair_seconds
  from public.app_config where key = 'rate_limit_login_pair';
  select (value->>'limit')::integer, (value->>'window_seconds')::integer into v_account_limit, v_account_seconds
  from public.app_config where key = 'rate_limit_login_account';
  if v_pair_limit is null or v_pair_limit < 1 or v_pair_seconds is null or v_pair_seconds not between 1 and 86400
    or v_account_limit is null or v_account_limit < 1 or v_account_seconds is null or v_account_seconds not between 1 and 86400 then
    raise exception 'login_rate_limit_not_configured' using errcode = '22023';
  end if;

  select attempt_count, window_expires_at into v_pair_count, v_pair_expires
  from public.rate_limit_counters where bucket = 'login_pair' and subject_hash = p_pair_hash;
  select attempt_count, window_expires_at into v_account_count, v_account_expires
  from public.rate_limit_counters where bucket = 'login_account' and subject_hash = p_account_hash;

  return jsonb_build_object(
    'locked', coalesce(v_pair_count >= v_pair_limit and v_pair_expires > v_now, false),
    'challenge_required', coalesce(v_account_count >= v_account_limit and v_account_expires > v_now, false),
    'retry_after_seconds', case when v_pair_expires > v_now then greatest(1, ceil(extract(epoch from (v_pair_expires - v_now)))::integer) else 60 end
  );
end;
$$;

create or replace function public.record_login_failure(p_account_hash text, p_pair_hash text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pair_seconds integer;
  v_account_seconds integer;
begin
  if p_account_hash !~ '^[0-9a-f]{64}$' or p_pair_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_login_limit_input' using errcode = '22023';
  end if;
  select (value->>'window_seconds')::integer into v_pair_seconds from public.app_config where key = 'rate_limit_login_pair';
  select (value->>'window_seconds')::integer into v_account_seconds from public.app_config where key = 'rate_limit_login_account';
  if v_pair_seconds is null or v_pair_seconds not between 1 and 86400 or v_account_seconds is null or v_account_seconds not between 1 and 86400 then
    raise exception 'login_rate_limit_not_configured' using errcode = '22023';
  end if;
  perform * from public.bump_rate_limit_counter('login_pair', p_pair_hash, v_pair_seconds);
  perform * from public.bump_rate_limit_counter('login_account', p_account_hash, v_account_seconds);
  return true;
end;
$$;

create or replace function public.clear_login_failures(p_account_hash text, p_pair_hash text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_account_hash !~ '^[0-9a-f]{64}$' or p_pair_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_login_limit_input' using errcode = '22023';
  end if;
  delete from public.rate_limit_counters
  where (bucket = 'login_pair' and subject_hash = p_pair_hash)
    or (bucket = 'login_account' and subject_hash = p_account_hash);
  return true;
end;
$$;

create or replace function public.prune_expired_rate_limit_counters(p_limit integer default 500)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted integer;
begin
  if p_limit not between 1 and 1000 then raise exception 'invalid_prune_limit' using errcode = '22023'; end if;
  with expired as (
    select bucket, subject_hash from public.rate_limit_counters
    where window_expires_at <= now()
    order by window_expires_at
    limit p_limit
  )
  delete from public.rate_limit_counters counters using expired
  where counters.bucket = expired.bucket and counters.subject_hash = expired.subject_hash;
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.bump_rate_limit_counter(text, text, integer, timestamptz) from public, anon, authenticated;
revoke all on function public.consume_rate_limit(text, text) from public, anon, authenticated;
revoke all on function public.login_throttle_status(text, text) from public, anon, authenticated;
revoke all on function public.record_login_failure(text, text) from public, anon, authenticated;
revoke all on function public.clear_login_failures(text, text) from public, anon, authenticated;
revoke all on function public.prune_expired_rate_limit_counters(integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text) to service_role;
grant execute on function public.login_throttle_status(text, text) to service_role;
grant execute on function public.record_login_failure(text, text) to service_role;
grant execute on function public.clear_login_failures(text, text) to service_role;
grant execute on function public.prune_expired_rate_limit_counters(integer) to service_role;
