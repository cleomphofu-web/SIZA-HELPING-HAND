-- Never persist a review claim that the reference-check flow did not collect.
-- Earlier applied migrations remain immutable.

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
declare
  v_retention_days integer;
  v_documents_exist boolean;
  v_updated integer;
begin
  if not exists (
    select 1
    from public.profiles p
    join public.admins a on a.user_id = p.id
    where p.id = p_actor_id and p.role = 'admin' and p.deleted_at is null
  ) then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  if p_action = 'approve' then
    update public.helper_details
    set status = 'approved',
        approved_at = now(),
        vetted_at = now(),
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

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    return false;
  end if;

  if p_action in ('approve', 'decline') then
    select exists (
      select 1 from public.helper_private_docs d where d.helper_id = p_helper_id
    ) into v_documents_exist;
    if v_documents_exist then
      select case
        when jsonb_typeof(c.value) = 'number'
          and (c.value #>> '{}') ~ '^[1-9][0-9]*$'
          and (c.value #>> '{}')::numeric <= 2147483647
        then (c.value #>> '{}')::integer
        else null
      end
      into v_retention_days
      from public.app_config c
      where c.key = 'id_doc_retention_days';

      if v_retention_days is null then
        raise exception 'invalid_document_retention_config' using errcode = '22023';
      end if;

      update public.helper_private_docs
      set delete_after = transaction_timestamp() + make_interval(days => v_retention_days)
      where helper_id = p_helper_id;
    end if;
  end if;

  insert into public.phase_a_audit_log (actor_id, action, entity, entity_id)
  values (p_actor_id, 'helper_' || p_action || 'd', 'helper_details', p_helper_id);
  return true;
end;
$$;

revoke execute on function public.admin_review_helper(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_review_helper(uuid, uuid, text, text) to service_role;
