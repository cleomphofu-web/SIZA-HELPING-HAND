# SIZA safety policy

The full mechanism is defined by the `safety-guard` skill. This page records only the SIZA application of it.

- Use Guard mode for migrations, deploys, linked-database work, real-data tests, and destructive cleanup: careful-command interception plus a write freeze to the active stage directory.
- Keep ordinary development under careful checks; never use force-push, hard reset, broad deletion, destructive SQL, or Docker cleanup without explicit approval.
- Treat `supabase/migrations/0001_init.sql` as immutable. Add forward-only migrations.
- Never commit `.env*`, credentials, tokens, passwords, private documents, or test identities.
- Linked Supabase is read-only unless the owner explicitly authorises a write. Use local Supabase or a separate disposable test project for integration/RLS/concurrency tests.
- Real-data tests require disposable identities, no secret output, a written cleanup plan, and cleanup verification.
- Record every risky operation in [`docs/ops-log.md`](ops-log.md), including blocked commands and environment failures.
