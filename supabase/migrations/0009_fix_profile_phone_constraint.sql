-- Correct the forward-added South African phone check without editing applied history.
alter table public.profiles drop constraint profiles_phone_check;
alter table public.profiles
  add constraint profiles_phone_check
  check (phone ~ '^[+]27[6-8][0-9]{8}$');
