---
name: siza-database-supabase
description: SIZA Postgres and Supabase rules for migrations, schema, RLS, constraints, triggers, SQL functions, atomic claims, indexes, storage buckets and RLS tests. Use when writing or reviewing any SQL, migration, policy, storage rule, Supabase client usage, or data access function.
metadata:
  origin: SIZA
---

# SIZA Database (Postgres on Supabase)

## Workflow
Schema changes only through `supabase/migrations/*.sql` (Supabase CLI). Never edit the schema in the dashboard. Every migration is forward-only, reviewed, and tested on a local stack (`supabase start`) before merge. Generate types after each migration.

## Defaults
- Primary keys: `uuid` (`gen_random_uuid()`) for user-facing rows; foreign keys always indexed.
- `text` not `varchar(n)`; `timestamptz` not `timestamp`; money `bigint` cents; flags `boolean`; enums as Postgres enums or `check` constraints.
- `created_at timestamptz not null default now()` on every table; `updated_at` where rows change.
- Constraints carry the invariants: `check (amount_cents >= 0)`, `unique (booking_id, slot)`, `unique (phone)`, `unique (id_hash)`.

## RLS is mandatory
- `alter table ... enable row level security` on every table in the same migration that creates it. No policy means no access.
- No public/anon policies on any table. All app access goes through the server with the service role; RLS is the safety net if that ever leaks.
- Revoke default grants: `revoke all on all tables in schema public from anon, authenticated;` then grant only what a policy needs.
- Policies wrap auth calls: `using ((select auth.uid()) = user_id)` (evaluated once, not per row).
- Admin is a row in `admins` checked in a `security definer` helper `is_admin()`; never trust a client claim.

## Server auth in Next.js
Use `@supabase/ssr` for cookies. On the server authorize with `supabase.auth.getUser()` (validates the token), never `getSession()` alone. The service-role client is created only in `src/server/db` and never exported to client code.

## Atomic operations live in SQL
Write Postgres functions for: slot claim, state transitions that touch several rows, rate-limit hit, check-in code attempt counter. Example claim:
```sql
update booking_slots set cleaner_id = $1, accepted_at = now()
where booking_id = $2 and cleaner_id is null
returning *;   -- zero rows => already_taken
```
Add `unique (booking_id, cleaner_id)` so one cleaner cannot take two slots.

## Ledger and audit (append-only)
```sql
create function forbid_change() returns trigger language plpgsql as $$
begin raise exception 'append-only table'; end $$;
create trigger ledger_no_update before update or delete on ledger_entries
for each row execute function forbid_change();
```
Same for `audit_log`. Corrections are new rows.

## Storage
Buckets are private. Object names are random (uuid), never user-derived. Access only via server-generated signed URLs (60 s). A scheduled job deletes ID photos and selfie-check images 30 days after the decision; `id_number_encrypted` is nulled at approve/decline; `id_hash` stays.

## Sensitive columns
Encrypt `id_number_encrypted` and bank account numbers with AES-256-GCM (key in env, not in DB). Store the check-in code and `id_hash` only as HMAC (secret in env). Never select these columns into app objects that get logged or serialised.

## Performance
Index foreign keys and every `where`/`order by` used by a list; composite indexes equality-first then range; partial indexes for hot subsets (e.g. open bookings). Cursor pagination. `statement_timeout` 30 s. Check plans (`explain analyze`) for any query on bookings or offers.

## Tests (required)
For each table: anon cannot select/insert; wrong role cannot read; owner can; admin can. Concurrency: 20 parallel claims, one winner. Triggers: update/delete on ledger raises. Run against local Supabase with real JWTs for each role.

## Checklist
- [ ] RLS on, no public policy, grants revoked.
- [ ] Constraints express the invariants.
- [ ] Atomic SQL for claims and counters.
- [ ] Sensitive columns encrypted or hashed.
- [ ] Migration applies from scratch; types regenerated; RLS tests added.
