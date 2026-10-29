# ADR 001: Applied migrations are immutable

**Status:** Accepted — 17 October 2026

## Context

The owner confirmed `supabase/migrations/0001_init.sql` is already applied. It contains superseded cleaner terminology. Altering an applied migration would make database history differ between environments and is unsafe.

## Decision

Keep `0001_init.sql` unchanged and list that exact path in `tools/quality/forbidden-terms.json` `ignoreFiles`. The repository's terminology check continues to scan Supabase migrations. The forward-only `0002_helper_terminology.sql` is temporarily ignored only because it must name legacy database objects in order to rename them; its target objects use helper terminology. New migrations must use helper terminology and will be checked normally.

## Consequences

- Schema corrections are additive, forward-only migrations; none are executed during repository cleanup.
- The terminology checker still protects all future, ordinary migration files.
- The exception is documented rather than silently weakening the checker for the entire migration directory.
