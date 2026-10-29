-- Close the pending feature even when an earlier app_config value was true.
-- Owner/lawyer notice approval and a reviewed enable action remain required.
insert into public.app_config (key, value)
values ('helper_gender_matching_enabled', 'false'::jsonb)
on conflict (key) do update set value = excluded.value;
