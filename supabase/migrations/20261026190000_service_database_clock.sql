-- Keep helper offer visibility and subscription reads on the same clock as
-- the atomic claim function, which evaluates expiry with PostgreSQL now().

create function public.get_phase_a_database_now()
returns timestamptz
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  return now();
end;
$$;

revoke execute on function public.get_phase_a_database_now() from public, anon, authenticated;
grant execute on function public.get_phase_a_database_now() to service_role;
