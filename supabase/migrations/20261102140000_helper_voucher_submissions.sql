-- 20261102140000_helper_voucher_submissions.sql
-- Allow helpers to submit prepaid subscription vouchers (1voucher, ott, blu_voucher, etc.)

create table if not exists public.phase_a_voucher_submissions (
  id uuid primary key default gen_random_uuid(),
  helper_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('1voucher', 'ott', 'blu_voucher', 'other')),
  voucher_pin text not null check (char_length(trim(voucher_pin)) between 6 and 50),
  period_months integer not null check (period_months in (1, 3, 6)),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_voucher_submissions_helper on public.phase_a_voucher_submissions(helper_id, created_at desc);
create index if not exists idx_voucher_submissions_status on public.phase_a_voucher_submissions(status);

alter table public.phase_a_voucher_submissions enable row level security;

-- Helpers can select and insert their own voucher submissions
create policy helper_voucher_select on public.phase_a_voucher_submissions
  for select to authenticated
  using (helper_id = auth.uid());

create policy helper_voucher_insert on public.phase_a_voucher_submissions
  for insert to authenticated
  with check (helper_id = auth.uid());

-- Admins can read all and update
create policy voucher_admin_all on public.phase_a_voucher_submissions
  for all to authenticated
  using (public.is_admin());

