-- Migration: In-App Arrival Notes & Booking Message Board
-- Enables secure, zero-dependency coordination between hosts and assigned helpers
-- Forward-only, append-only.

create table if not exists public.booking_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.phase_a_bookings(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  sender_role text not null check (sender_role in ('host', 'helper', 'admin')),
  sender_first_name text not null check (char_length(sender_first_name) between 1 and 80),
  message text not null check (char_length(message) between 1 and 1000),
  created_at timestamptz not null default now()
);

comment on table public.booking_messages is
  'Job-scoped arrival and access notes exchanged between host and assigned helpers.';

create index if not exists idx_booking_messages_booking_created
  on public.booking_messages(booking_id, created_at asc);

-- Enable Row Level Security (server-only access through admin client with policy checks)
alter table public.booking_messages enable row level security;

