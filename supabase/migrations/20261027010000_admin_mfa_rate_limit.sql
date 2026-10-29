-- Give the short TOTP code its own database-backed attempt bucket.
-- The app consumes it before validation/verification, so malformed and valid
-- submissions both count toward the same conservative account limit.

alter table public.rate_limit_counters
  drop constraint rate_limit_bucket_known;

alter table public.rate_limit_counters
  add constraint rate_limit_bucket_known check (bucket in (
    'booking', 'apply', 'upload', 'login', 'accept', 'report', 'code_attempt', 'admin_action',
    'login_pair', 'login_account', 'mfa_verify'
  ));

insert into public.app_config(key, value)
values ('rate_limit_mfa_verify', '{"limit":5,"window_seconds":900}'::jsonb)
on conflict (key) do nothing;

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
  if p_bucket not in ('booking', 'apply', 'upload', 'login', 'accept', 'report', 'code_attempt', 'admin_action', 'mfa_verify') then
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

revoke all on function public.consume_rate_limit(text, text) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text) to service_role;
