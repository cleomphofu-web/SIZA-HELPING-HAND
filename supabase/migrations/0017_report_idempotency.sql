-- Ensure report retries cannot create duplicate Phase A reports.
-- Previously applied migrations, especially 0001_init.sql, remain immutable.

alter table public.phase_a_reports
  add column idempotency_key uuid;

create unique index phase_a_reports_reporter_idempotency_key_idx
  on public.phase_a_reports (reporter_id, idempotency_key)
  where idempotency_key is not null;

create or replace function public.create_phase_a_report(
  p_reporter_id uuid,
  p_booking_id uuid,
  p_subject_id uuid,
  p_category text,
  p_text text,
  p_idempotency_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  report_id uuid;
  booking_row public.phase_a_bookings;
begin
  if p_idempotency_key is null
    or p_category not in ('no_show', 'safety', 'payment', 'conduct', 'other')
    or char_length(trim(coalesce(p_text, ''))) not between 1 and 3000 then
    raise exception 'invalid_report' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = p_reporter_id and p.role in ('host', 'helper', 'admin')
  ) then
    raise exception 'reporter_not_allowed' using errcode = '42501';
  end if;

  if p_booking_id is null then
    raise exception 'booking_required' using errcode = '22023';
  end if;

  select b.* into booking_row
  from public.phase_a_bookings b
  where b.id = p_booking_id
  for update;

  if booking_row.id is null then
    raise exception 'booking_not_found' using errcode = 'P0002';
  end if;

  if not (
    booking_row.host_id = p_reporter_id
    or exists (
      select 1 from public.booking_assignments a
      where a.booking_id = p_booking_id and a.helper_id = p_reporter_id
    )
    or exists (
      select 1 from public.admins a
      join public.profiles p on p.id = a.user_id
      where a.user_id = p_reporter_id and p.role = 'admin'
    )
  ) then
    raise exception 'booking_not_found' using errcode = 'P0002';
  end if;

  if p_subject_id is not null and not (
    (p_subject_id = booking_row.host_id and p_subject_id <> p_reporter_id)
    or exists (
      select 1 from public.booking_assignments a
      where a.booking_id = p_booking_id and a.helper_id = p_subject_id and p_subject_id <> p_reporter_id
    )
  ) then
    raise exception 'booking_not_found' using errcode = 'P0002';
  end if;

  select r.id into report_id
  from public.phase_a_reports r
  where r.reporter_id = p_reporter_id and r.idempotency_key = p_idempotency_key;
  if report_id is not null then
    return report_id;
  end if;

  insert into public.phase_a_reports (
    booking_id, reporter_id, subject_id, category, text, idempotency_key
  ) values (
    p_booking_id, p_reporter_id, p_subject_id, p_category, trim(p_text), p_idempotency_key
  ) on conflict (reporter_id, idempotency_key) where idempotency_key is not null do nothing
  returning id into report_id;

  if report_id is null then
    select r.id into report_id
    from public.phase_a_reports r
    where r.reporter_id = p_reporter_id and r.idempotency_key = p_idempotency_key;
  end if;

  if report_id is null then
    raise exception 'report_not_saved';
  end if;
  return report_id;
end;
$$;

revoke all on function public.create_phase_a_report(uuid, uuid, uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.create_phase_a_report(uuid, uuid, uuid, text, text, uuid) to service_role;
