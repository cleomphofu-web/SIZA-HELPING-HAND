-- Keep helper review mutations and their audit entries in one transaction.
-- Previously applied migrations, including 0001_init.sql, remain immutable.

create or replace function public.admin_review_helper(
  p_actor_id uuid,
  p_helper_id uuid,
  p_action text,
  p_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    join public.admins a on a.user_id = p.id
    where p.id = p_actor_id and p.role = 'admin'
  ) then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  if p_action = 'approve' then
    update public.helper_details
    set status = 'approved',
        approved_at = now(),
        vetted_at = now(),
        check_notes_private = 'ID matches selfie; ID readable; references called',
        id_number_encrypted = null,
        updated_at = now()
    where user_id = p_helper_id and status = 'pending';
  elsif p_action = 'decline' then
    update public.helper_details
    set status = 'declined',
        decline_reason = nullif(left(trim(coalesce(p_reason, '')), 1000), ''),
        id_number_encrypted = null,
        updated_at = now()
    where user_id = p_helper_id and status = 'pending';
  elsif p_action = 'suspend' then
    if nullif(trim(coalesce(p_reason, '')), '') is null then
      raise exception 'suspension_reason_required' using errcode = '22023';
    end if;
    update public.helper_details
    set status = 'suspended',
        decline_reason = left(trim(p_reason), 1000),
        updated_at = now()
    where user_id = p_helper_id and status = 'approved';
  else
    raise exception 'invalid_helper_review_action' using errcode = '22023';
  end if;

  if not found then
    return false;
  end if;

  insert into public.phase_a_audit_log (actor_id, action, entity, entity_id)
  values (p_actor_id, 'helper_' || p_action || 'd', 'helper_details', p_helper_id);
  return true;
end;
$$;

revoke execute on function public.admin_review_helper(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_review_helper(uuid, uuid, text, text) to service_role;
