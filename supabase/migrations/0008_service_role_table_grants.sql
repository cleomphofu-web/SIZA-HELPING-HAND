-- The service-role database client is server-only and enforces role/ownership in services.
-- Grant only the Phase A tables used by server code and local integration fixtures.
-- Previously applied migrations, especially 0001_init.sql, remain immutable.

grant usage on schema public to service_role;

grant select, insert, update, delete on table
  public.profiles,
  public.admins,
  public.host_details,
  public.helper_details,
  public.helper_private_docs,
  public.service_categories,
  public.rate_card,
  public.transport_zones,
  public.app_config,
  public.phase_a_bookings,
  public.booking_assignments,
  public.booking_offers,
  public.phase_a_reports,
  public.phase_a_audit_log
to service_role;
