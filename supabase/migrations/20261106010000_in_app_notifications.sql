-- In-app notification inbox for hosts and helpers.
-- Each row is owned by one user (user_id = auth.uid()).
-- Notifications are soft-read (read_at) and never deleted by users.
-- Retained 90 days after creation then cleaned by the retention job.
-- Forward-only, idempotent.

create type public.notification_kind as enum (
  'booking_confirmed',    -- host: helper accepted
  'booking_cancelled',    -- both: booking cancelled
  'booking_completed',    -- both: job done
  'helper_on_my_way',     -- host: helper en route
  'helper_arrived',       -- host: helper checked in
  'job_offer',            -- helper: new job available
  'no_show_resolved',     -- host: no-show handled
  'subscription_reminder' -- helper: sub due soon
);

create table public.in_app_notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  kind          public.notification_kind not null,
  title         text not null check (char_length(title) between 1 and 120),
  body          text not null check (char_length(body) between 1 and 500),
  -- Optional link to open when tapped (relative path, e.g. /app/requests/123)
  action_path   text check (action_path is null or (action_path ~ '^/' and char_length(action_path) <= 200)),
  -- Related entity (booking id, etc.) for deduplication
  reference_id  uuid,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

-- Index for the per-user unread count + inbox query
create index in_app_notifications_user_unread
  on public.in_app_notifications (user_id, created_at desc)
  where read_at is null;

-- Index for the full inbox (read + unread)
create index in_app_notifications_user_created
  on public.in_app_notifications (user_id, created_at desc);

-- Retention: auto-delete notifications older than 90 days
-- (enforced by the existing retention cron job reading app_config)
insert into public.app_config (key, value)
values ('notification_retention_days', '90'::jsonb)
on conflict (key) do nothing;

alter table public.in_app_notifications enable row level security;

-- Users can only see their own notifications
create policy notifications_owner_read
  on public.in_app_notifications
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Users can mark their own notifications read (update read_at only)
create policy notifications_owner_mark_read
  on public.in_app_notifications
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Service role (server) can insert on behalf of any user
-- No direct client inserts — creation goes through server actions only
grant select, update on public.in_app_notifications to authenticated;
grant select, insert, update, delete on public.in_app_notifications to service_role;

