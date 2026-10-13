create extension if not exists pgcrypto;

create type public.cleaner_status as enum ('pending', 'approved', 'rejected');
create type public.booking_status as enum ('new', 'assigned', 'completed', 'cancelled');
create type public.rate_unit as enum ('per_hour', 'per_job');
create type public.document_type as enum ('profile_photo', 'selfie_id', 'id_document', 'proof_of_address');

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.cleaners (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text not null,
  suburbs text[] not null,
  services text[] not null,
  rate_amount numeric(12,2) not null check (rate_amount >= 0),
  rate_unit public.rate_unit not null,
  availability text not null,
  id_number_encrypted text not null,
  status public.cleaner_status not null default 'pending',
  rejection_reason text,
  id_matches_selfie boolean not null default false,
  id_readable boolean not null default false,
  references_called boolean not null default false,
  vetted_at timestamptz,
  approved_at timestamptz,
  free_until date,
  paid_until date,
  created_at timestamptz not null default now()
);

create table public.cleaner_documents (
  id uuid primary key default gen_random_uuid(),
  cleaner_id uuid not null references public.cleaners(id) on delete cascade,
  type public.document_type not null,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create table public.cleaner_references (
  id uuid primary key default gen_random_uuid(),
  cleaner_id uuid not null references public.cleaners(id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_phone text not null,
  client_email text not null,
  suburb text not null,
  address text not null,
  property_type text not null,
  cleaners_needed integer not null check (cleaners_needed between 1 and 4),
  start_at timestamptz not null,
  end_at timestamptz not null,
  access_notes text not null default '',
  notes text not null default '',
  status public.booking_status not null default 'new',
  assigned_cleaner_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint booking_time_order check (end_at > start_at)
);

alter table public.admins enable row level security;
alter table public.cleaners enable row level security;
alter table public.cleaner_documents enable row level security;
alter table public.cleaner_references enable row level security;
alter table public.bookings enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create policy admins_read_self on public.admins for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy cleaners_admin_all on public.cleaners for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy documents_admin_all on public.cleaner_documents for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy references_admin_all on public.cleaner_references for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy bookings_admin_all on public.bookings for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('cleaner-docs', 'cleaner-docs', false)
on conflict (id) do update set public = false;

create policy cleaner_docs_admin_read on storage.objects for select to authenticated
using (bucket_id = 'cleaner-docs' and public.is_admin());

create policy cleaner_docs_admin_write on storage.objects for insert to authenticated
with check (bucket_id = 'cleaner-docs' and public.is_admin());

create policy cleaner_docs_admin_delete on storage.objects for delete to authenticated
using (bucket_id = 'cleaner-docs' and public.is_admin());
