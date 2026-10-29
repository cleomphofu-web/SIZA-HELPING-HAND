# ADR 005: Atomic Phase A job completion

## Status

Implemented through forward-only migrations `20261025191302_atomic_phase_a_job_completion.sql`, `20261025191637_host_confirmation_completes_checked_in_job.sql`, and `20261025192123_reject_soft_deleted_completion_actor.sql`; applied to local Supabase only. Owner review pending. No linked database was changed.

## Context

`confirmPhaseABooking` previously wrote confirmations, read assignments, changed booking status, and marked helpers' first job in separate Data API requests. Those requests were not one transaction. Concurrent host/helper confirmations could observe an incomplete view of the other write. Completion also left each assignment in `accepted`, even though rotation counts completed assignments, so completed work could be missing from fairness ranking.

## Decision

- Move confirmation and completion into one forward-only database function, callable only by the server's `service_role` client.
- Recheck the actor's persisted profile role, active (not soft-deleted) status, and host ownership or helper assignment inside the function. Admins and nonparticipants cannot confirm.
- Lock the booking row, allow confirmations only for an `in_progress` booking (or an idempotent retry after completion), and update the host's or helper's confirmation timestamps atomically.
- Follow the spec's asymmetric rule: a helper's confirmation records only that helper's side; the host's confirmation completes the job after check-in. With multiple helpers, require each active assignment to have checked in before accepting the host's completion confirmation. An early host attempt rolls back without saving the confirmation. Auto-release is implemented separately under ADR 006; its scheduled invocation remains a Stage 4.4 operation.
- In the same transaction that completes the booking, set accepted assignment rows to `completed` and set each assigned helper's `first_job_completed_at` if it has not already been set. This ensures the first job counts only after recorded check-in and host confirmation, and completed work feeds the existing fairness ranking.
- Keep check-in as the gate that moves a booking into `in_progress`. No payment, fee, or Phase B behavior is added.

## Acceptance checks

- Wrong role, wrong host, unassigned helper, missing booking, and non-`in_progress` booking are denied without partial writes.
- A helper-only confirmation does not complete the job. Host confirmation after check-in atomically completes booking and assignments and opens the first-job subscription state, even if a helper has not separately confirmed.
- Concurrent host/helper confirmations produce a completed booking with completed assignments. Host confirmation does not wait for a helper's separate confirmation. Repeating a valid confirmation after completion is safe.
- Run with disposable local identities only; linked Supabase remains read-only.

## Consequences

Completed assignments now feed the existing fairness count. The API service becomes a thin RPC adapter. The migration must use a fixed search path, schema-qualified objects, and explicit function privileges. Existing applied migrations, especially `0001_init.sql`, remain unchanged.
