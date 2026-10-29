-- RLS policies also require SQL privileges; these grants do not bypass row policies.
-- No anon grants are added. Server-only writes continue through service_role.

grant select on table public.admins to authenticated;
grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.host_details, public.helper_details to authenticated;
grant select, insert, update, delete on table public.helper_private_docs to authenticated;
grant select, insert, update, delete on table public.service_categories, public.rate_card,
  public.transport_zones, public.app_config to authenticated;
grant select on table public.phase_a_bookings, public.booking_assignments, public.booking_offers to authenticated;
grant select, insert on table public.phase_a_reports to authenticated;
grant select on table public.phase_a_audit_log to authenticated;
