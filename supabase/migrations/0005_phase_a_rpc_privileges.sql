-- Phase A security follow-up.
-- Keep 0001-0004 immutable; restrict RPC execution through the API surface.

revoke execute on function public.claim_phase_a_slot(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_phase_a_slot(uuid, uuid, integer) to service_role;

revoke execute on function public.create_phase_a_offers(uuid, integer) from public, anon, authenticated;
grant execute on function public.create_phase_a_offers(uuid, integer) to service_role;

revoke execute on function public.record_phase_a_code_attempt(uuid, timestamptz, boolean, integer) from public, anon, authenticated;
grant execute on function public.record_phase_a_code_attempt(uuid, timestamptz, boolean, integer) to service_role;

-- is_admin() is used by authenticated RLS policies, but must not be callable anonymously.
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- Forward-fix the immutable admins policy to avoid per-row auth.uid() evaluation.
drop policy if exists admins_read_self on public.admins;
create policy admins_read_self on public.admins
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
