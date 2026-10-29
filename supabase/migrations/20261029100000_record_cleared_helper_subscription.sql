-- 20261029100000_record_cleared_helper_subscription.sql
-- Stage 4.3: Atomically record a cleared prepaid helper subscription payment and extend paid_until

create table if not exists public.phase_a_subscription_payments (
  id uuid primary key default gen_random_uuid(),
  helper_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  amount_cents bigint not null check (amount_cents > 0),
  period_months integer not null check (period_months in (1, 3, 6)),
  reference text not null check (char_length(trim(reference)) between 3 and 100),
  paid_until_before timestamptz,
  paid_until_after timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists phase_a_sub_payments_helper_idx on public.phase_a_subscription_payments(helper_id, created_at desc);
create index if not exists phase_a_sub_payments_ref_idx on public.phase_a_subscription_payments(reference);

alter table public.phase_a_subscription_payments enable row level security;

-- Admin-only read access; writes via service-role / rpc
create policy subscription_payments_admin on public.phase_a_subscription_payments
  for select to authenticated
  using (public.is_admin());

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

  -- 3. Lock helper details row
  select * into v_helper
  from public.helper_details
  where user_id = p_helper_id
  for update;

  if not found then
    raise exception 'helper_not_found' using errcode = 'P0002';
  end if;

  -- 4. Calculate new paid_until using calendar-month extension
  -- Starts from greater of now() or existing subscription_paid_until
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

  -- 7. Insert general audit log row (PII-free)
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

