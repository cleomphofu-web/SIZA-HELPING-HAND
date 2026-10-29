create or replace function public.prevent_reoffering_resolved_no_show_slot()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform 1
  from public.phase_a_bookings b
  where b.id = new.booking_id
  for update;

  if exists (
    select 1
    from public.booking_assignments a
    where a.booking_id = new.booking_id
      and a.slot = new.slot
      and a.status = 'no_show'
      and a.no_show_resolution is not null
  ) then
    raise exception 'no_show_slot_unavailable' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_reoffering_resolved_no_show_slot() from public, anon, authenticated;

create trigger booking_offers_reject_resolved_no_show_slot
before insert on public.booking_offers
for each row
execute function public.prevent_reoffering_resolved_no_show_slot();
