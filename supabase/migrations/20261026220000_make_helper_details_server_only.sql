-- helper_details contains encrypted identity fields and private matching data.
-- All product reads and writes already pass through server-only services using
-- service_role; authenticated clients must not bypass those redacted views.
revoke all on table public.helper_details from anon, authenticated;
grant all on table public.helper_details to service_role;
