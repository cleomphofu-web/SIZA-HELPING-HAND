-- Store only a keyed digest of a TOTP code, never the code itself.
create table public.admin_mfa_code_uses (
  factor_id uuid not null,
  code_hash text not null check (code_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  primary key (factor_id, code_hash),
  constraint admin_mfa_code_use_expiry check (expires_at > created_at)
);

create index admin_mfa_code_uses_expiry_idx on public.admin_mfa_code_uses(expires_at);
alter table public.admin_mfa_code_uses enable row level security;
revoke all on public.admin_mfa_code_uses from public, anon, authenticated, service_role;

insert into public.app_config(key, value)
values ('admin_mfa_replay_seconds', '90'::jsonb)
on conflict (key) do nothing;

create or replace function public.reserve_admin_mfa_code(p_factor_id uuid, p_code_hash text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_replay_seconds integer;
  v_inserted integer := 0;
begin
  if p_factor_id is null or p_code_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_admin_mfa_replay_input' using errcode = '22023';
  end if;

  select (value #>> '{}')::integer into v_replay_seconds
  from public.app_config where key = 'admin_mfa_replay_seconds';
  if v_replay_seconds is null or v_replay_seconds not between 30 and 300 then
    raise exception 'admin_mfa_replay_window_not_configured' using errcode = '22023';
  end if;

  delete from public.admin_mfa_code_uses where expires_at <= now();

  insert into public.admin_mfa_code_uses(factor_id, code_hash, expires_at)
  values (p_factor_id, p_code_hash, now() + make_interval(secs => v_replay_seconds))
  on conflict (factor_id, code_hash) do nothing;
  get diagnostics v_inserted = row_count;
  return v_inserted > 0;
end;
$$;

revoke all on function public.reserve_admin_mfa_code(uuid, text) from public, anon, authenticated;
grant execute on function public.reserve_admin_mfa_code(uuid, text) to service_role;
