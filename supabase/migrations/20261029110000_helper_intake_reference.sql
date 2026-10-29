-- 20261029110000_helper_intake_reference.sql
-- Stage 3.2: Capture helper reference (name and phone) atomically during helper application creation

create table if not exists public.phase_a_helper_references (
  id uuid primary key default gen_random_uuid(),
  helper_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  phone text not null check (char_length(trim(phone)) between 7 and 30),
  created_at timestamptz not null default now(),
  constraint phase_a_helper_references_unique_helper unique(helper_id)
);

create index if not exists phase_a_helper_references_helper_idx on public.phase_a_helper_references(helper_id);

alter table public.phase_a_helper_references enable row level security;

-- Admin-only policy for helper references (PII protection)
create policy helper_references_admin_read on public.phase_a_helper_references
  for select to authenticated
  using (public.is_admin());

-- Drop the old 12-argument overload so PostgREST resolves the function uniquely
drop function if exists public.create_helper_application(uuid, date, text, text[], text[], text, text, text, text, text, text, text);

-- Update create_helper_application function to accept and store reference
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
  p_selfie_check_path text,
  p_reference_name text default null,
  p_reference_phone text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ref_name text;
  v_ref_phone text;
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

  -- 1. Insert helper profile details
  insert into public.helper_details (
    user_id, date_of_birth, job_title, services, suburbs, bio, experience_note,
    rate_note, status, id_number_encrypted, id_hash
  ) values (
    p_helper_id, p_date_of_birth, p_job_title, p_services, p_suburbs,
    coalesce(p_bio, ''), coalesce(p_experience_note, ''), coalesce(p_rate_note, ''),
    'pending', p_id_number_encrypted, p_id_hash
  );

  -- 2. Insert helper private documents
  insert into public.helper_private_docs (helper_id, type, storage_path, delete_after)
  values
    (p_helper_id, 'id_photo', p_id_photo_path, null),
    (p_helper_id, 'selfie_check', p_selfie_check_path, null);

  -- 3. Insert helper reference if supplied
  v_ref_name := trim(coalesce(p_reference_name, ''));
  v_ref_phone := trim(coalesce(p_reference_phone, ''));
  if char_length(v_ref_name) >= 2 and char_length(v_ref_phone) >= 7 then
    insert into public.phase_a_helper_references (helper_id, name, phone)
    values (p_helper_id, v_ref_name, v_ref_phone)
    on conflict (helper_id) do nothing;
  end if;
end;
$$;

revoke execute on function public.create_helper_application(uuid, date, text, text[], text[], text, text, text, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.create_helper_application(uuid, date, text, text[], text[], text, text, text, text, text, text, text, text, text)
  to service_role;
