-- Keep the auto-release interval a positive whole number as admin config evolves.
alter table public.app_config
  add constraint app_config_auto_release_hours_positive_integer
  check (
    key <> 'auto_release_hours'
    or (
      jsonb_typeof(value) = 'number'
      and (value #>> '{}') ~ '^[1-9][0-9]*$'
    )
  );
