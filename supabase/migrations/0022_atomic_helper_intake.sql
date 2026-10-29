-- Keep application profile/document creation atomic and begin retention at review decision.
-- 0001_init.sql and every previously applied migration are immutable.

alter table public.helper_private_docs alter column delete_after drop not null;

create or replace function public.create_helper_application(
  p_helper_id uuid,
  p_date_of_birth date,
  p_job_title text,
  p_services text[],
  p_suburbs text[],
  p_bio text,
  p_experience_note text,
  p_rate_note text,
  p_id_number_encrypted text,
  p_id_hash text,
  p_id_photo_path text,
  p_selfie_check_path text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = p_helper_id and p.role = 'helper' and p.deleted_at is null
  ) then
    raise exception 'active_helper_required' using errcode = '42501';
  end if;

  if p_id_photo_path is null
     or p_selfie_check_path is null
     or p_id_photo_path = p_selfie_check_path
     or p_id_photo_path !~ ('^' || p_helper_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$')
     or p_selfie_check_path !~ ('^' || p_helper_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$') then
    raise exception 'invalid_document_path' using errcode = '22023';
  end if;

  insert into public.helper_details (
    user_id, date_of_birth, job_title, services, suburbs, bio, experience_note,
    rate_note, status, id_number_encrypted, id_hash
  ) values (
    p_helper_id, p_date_of_birth, p_job_title, p_services, p_suburbs,
    coalesce(p_bio, ''), coalesce(p_experience_note, ''), coalesce(p_rate_note, ''),
    'pending', p_id_number_encrypted, p_id_hash
  );

  insert into public.helper_private_docs (helper_id, type, storage_path, delete_after)
  values
    (p_helper_id, 'id_photo', p_id_photo_path, null),
    (p_helper_id, 'selfie_check', p_selfie_check_path, null);
end;
$$;

revoke execute on function public.create_helper_application(uuid, date, text, text[], text[], text, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.create_helper_application(uuid, date, text, text[], text[], text, text, text, text, text, text, text)
  to service_role;

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
