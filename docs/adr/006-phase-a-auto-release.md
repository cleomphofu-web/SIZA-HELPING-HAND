# ADR 006: Phase A auto-release completion

## Status

Implemented by forward-only migrations `20261025213500_phase_a_auto_release.sql`, `20261025214500_phase_a_auto_release_report_recheck.sql`, `20261025220000_phase_a_auto_release_complete_slots.sql`, and `20261025221000_phase_a_auto_release_config_guard.sql`; applied to local Supabase only. Owner review pending. No linked-project operation occurred, and applied migrations were left unchanged.

## Context

Spec 6.5 requires completion after the configured `auto_release_hours` when the host has not confirmed, provided check-in was recorded and no report is open. This is also the first-job completion path in spec 6.7. The host-confirmation RPC handles the immediate path, but there was no auto-release function.

## Decision

- Add a service-role-only database function that processes overdue `in_progress` bookings in one transaction per invocation. It reads `auto_release_hours` from `app_config` and fails closed if the value is missing or invalid; it does not duplicate the seeded 24-hour value in application logic. A database constraint requires this setting to be a positive whole number, preventing fractional values from being rounded during function evaluation.
- A booking is eligible only when its active assignment count equals the requested helper slots, every accepted helper has a recorded check-in, no assignment has a host confirmation, and no report for the booking has status `open` or `reviewing`.
- Lock eligible booking rows with `FOR UPDATE SKIP LOCKED`, recheck report and assignment state after acquiring each booking lock, then set the booking and accepted assignments to `completed` and set each helper's `first_job_completed_at` if missing. This makes retries and concurrent scheduled invocations safe.
- Keep Phase B money release, dispute resolution, and scheduler configuration out of this function. Stage 4.4 will invoke it from an authenticated scheduled job.
- Use a fixed empty search path, schema-qualified objects, and explicit execute grants. Do not change `0001_init.sql` or any previously applied migration.

## Verification

Local integration cases cover due versus early bookings, check-in and requested-slot requirements, open and reviewing report freezes, prior host confirmation, no assignment, first-job state, concurrent invocation, retry, non-service-role denial, and rejection of fractional configuration. Local Supabase only; no linked writes.

## Consequences

Phase A bookings no longer remain in progress forever solely because a host does not confirm, provided the configured conditions are satisfied. The function is not scheduled yet, so it will not run automatically until Stage 4.4 is implemented. There is no payout or funds release in Phase A.
