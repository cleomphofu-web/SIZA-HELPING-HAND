-- 20261107100000_yoco_helper_subscription_r120.sql
-- Overhaul helper monthly subscription:
-- 1. Fixed fee R120 (12,000 cents in app_config)
-- 2. Yoco payment link URL in app_config
-- 3. Strict duplicate-charge prevention: unique reference index and safe extension from current expiry
-- 4. Helper Yoco payment submission tracking table & RPC

-- 1. Update app_config for R120 fee & Yoco link
insert into public.app_config(key, value)
values 
  ('subscription_monthly_cents', '12000'::jsonb),
  ('yoco_payment_link_url', '"https://pay.yoco.com/siza"'::jsonb)
on conflict (key) do update set
  value = excluded.value,
  updated_at = now();

-- 2. Prevent duplicate settled payment references
create unique index if not exists phase_a_sub_payments_ref_unique_idx 
  on public.phase_a_subscription_payments(lower(trim(reference)));

-- 3. Create Yoco payment submission tracking table
create table if not exists public.phase_a_yoco_submissions (
  id uuid primary key default gen_random_uuid(),
  helper_id uuid not null references public.profiles(id) on delete cascade,
  reference text not null check (char_length(trim(reference)) between 3 and 100),
  amount_cents bigint not null default 12000 check (amount_cents > 0),
  period_months integer not null default 1 check (period_months in (1, 3, 6)),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create unique index if not exists phase_a_yoco_submissions_ref_unique_idx 
  on public.phase_a_yoco_submissions(lower(trim(reference)));

create index if not exists phase_a_yoco_submissions_helper_idx 
  on public.phase_a_yoco_submissions(helper_id, created_at desc);

alter table public.phase_a_yoco_submissions enable row level security;

-- Drop any existing policies before re-creating
drop policy if exists yoco_submissions_helper_read on public.phase_a_yoco_submissions;
drop policy if exists yoco_submissions_helper_insert on public.phase_a_yoco_submissions;
drop policy if exists yoco_submissions_admin_all on public.phase_a_yoco_submissions;

create policy yoco_submissions_helper_read on public.phase_a_yoco_submissions
  for select to authenticated
  using (auth.uid() = helper_id);

create policy yoco_submissions_helper_insert on public.phase_a_yoco_submissions
  for insert to authenticated
  with check (auth.uid() = helper_id);

create policy yoco_submissions_admin_all on public.phase_a_yoco_submissions
  for all to authenticated
  using (public.is_admin());

-- 4. Update admin_record_helper_subscription with duplicate check & Yoco submission resolution
create or replace function public.admin_record_helper_subscription(
  p_actor_id uuid,
  p_helper_id uuid,
  p_amount_cents bigint,
  p_period_months integer,
  p_reference text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_helper public.helper_details%rowtype;
  v_start timestamptz;
  v_new_paid_until timestamptz;
  v_payment_id uuid;
  v_ref text;
begin
  -- 1. Check admin authorization
  if not exists (
    select 1
    from public.profiles p
    join public.admins a on a.user_id = p.id
    where p.id = p_actor_id and p.role = 'admin' and p.deleted_at is null
  ) then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  -- 2. Validate input parameters
  if p_period_months not in (1, 3, 6) then
    raise exception 'invalid_period_months' using errcode = '22023';
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'invalid_amount_cents' using errcode = '22023';
  end if;

  v_ref := trim(coalesce(p_reference, ''));
  if char_length(v_ref) < 3 or char_length(v_ref) > 100 then
    raise exception 'invalid_reference' using errcode = '22023';
  end if;

  -- Check for duplicate reference
  if exists (
    select 1
    from public.phase_a_subscription_payments
    where lower(trim(reference)) = lower(v_ref)
  ) then
    raise exception 'duplicate_reference' using errcode = '23505';
  end if;

  -- 3. Lock helper details row
  select * into v_helper
  from public.helper_details
  where user_id = p_helper_id
  for update;

  if not found then
    raise exception 'helper_not_found' using errcode = 'P0002';
  end if;

  -- 4. Calculate new paid_until using calendar-month extension
  -- Never lose days: starts from greater of now() or existing subscription_paid_until
  if v_helper.subscription_paid_until is not null and v_helper.subscription_paid_until > now() then
    v_start := v_helper.subscription_paid_until;
  else
    v_start := now();
  end if;

  v_new_paid_until := v_start + (p_period_months || ' months')::interval;

  -- 5. Update helper details
  update public.helper_details
  set subscription_status = 'active',
      subscription_paid_until = v_new_paid_until,
      updated_at = now()
  where user_id = p_helper_id;

  -- 6. Insert subscription payment audit record
  insert into public.phase_a_subscription_payments (
    helper_id,
    actor_id,
    amount_cents,
    period_months,
    reference,
    paid_until_before,
    paid_until_after
  ) values (
    p_helper_id,
    p_actor_id,
    p_amount_cents,
    p_period_months,
    v_ref,
    v_helper.subscription_paid_until,
    v_new_paid_until
  )
  returning id into v_payment_id;

  -- 7. Update any matching Yoco submission to 'approved'
  update public.phase_a_yoco_submissions
  set status = 'approved'
  where lower(trim(reference)) = lower(v_ref);

  -- 8. Insert general audit log row (PII-free)
  insert into public.phase_a_audit_log (
    actor_id,
    action,
    entity,
    entity_id
  ) values (
    p_actor_id,
    'helper_subscription_recorded',
    'phase_a_subscription_payments',
    v_payment_id
  );

  return jsonb_build_object(
    'payment_id', v_payment_id,
    'subscription_status', 'active',
    'paid_until', v_new_paid_until
  );
end;
$$;

revoke all on function public.admin_record_helper_subscription(uuid, uuid, bigint, integer, text) from public;
grant execute on function public.admin_record_helper_subscription(uuid, uuid, bigint, integer, text) to service_role;

-- 5. Helper RPC to submit Yoco payment reference
create or replace function public.helper_submit_yoco_payment(
  p_reference text,
  p_period_months integer default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_helper_id uuid;
  v_ref text;
  v_submission_id uuid;
  v_sub_cents bigint;
begin
  v_helper_id := auth.uid();
  if v_helper_id is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.helper_details where user_id = v_helper_id
  ) then
    raise exception 'helper_required' using errcode = '42501';
  end if;

  v_ref := trim(coalesce(p_reference, ''));
  if char_length(v_ref) < 3 or char_length(v_ref) > 100 then
    raise exception 'invalid_reference' using errcode = '22023';
  end if;

  if p_period_months not in (1, 3, 6) then
    raise exception 'invalid_period_months' using errcode = '22023';
  end if;

  -- Check if already cleared by admin
  if exists (
    select 1
    from public.phase_a_subscription_payments
    where lower(trim(reference)) = lower(v_ref)
  ) then
    return jsonb_build_object(
      'ok', true,
      'already_cleared', true,
      'message', 'This payment has already been verified and applied to your account.'
    );
  end if;

  -- Check if already submitted
  if exists (
    select 1
    from public.phase_a_yoco_submissions
    where lower(trim(reference)) = lower(v_ref)
  ) then
    return jsonb_build_object(
      'ok', false,
      'error', 'duplicate_reference',
      'message', 'This payment reference has already been submitted and is currently being verified.'
    );
  end if;

  -- Default 12,000 cents per month (R120)
  v_sub_cents := 12000 * p_period_months;

  insert into public.phase_a_yoco_submissions (
    helper_id,
    reference,
    amount_cents,
    period_months,
    status
  ) values (
    v_helper_id,
    v_ref,
    v_sub_cents,
    p_period_months,
    'pending'
  )
  returning id into v_submission_id;

  return jsonb_build_object(
    'ok', true,
    'submission_id', v_submission_id,
    'status', 'pending',
    'message', 'Your Yoco payment reference has been submitted. It will be verified shortly.'
  );
end;
$$;

revoke all on function public.helper_submit_yoco_payment(text, integer) from public;
grant execute on function public.helper_submit_yoco_payment(text, integer) to authenticated;

