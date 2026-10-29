# ADR 009: Atomic helper check-in and attempt lockout

## Status

Implemented locally; owner review pending. No linked Supabase operation is authorized or included.

## Context

The helper service verifies the submitted code's HMAC, calls a database function that changes the booking to `in_progress`, and only afterward updates the helper assignment's `checked_in_at`. If the final request fails, booking state and attendance disagree. Attempt handling also does not reset the counter after the 15-minute lock expires.

## Decision

- Keep the check-in HMAC and constant-time comparison in the server. The server passes only the comparison result to a service-role-only RPC; authenticated users cannot call that RPC or the removed legacy counter function directly.
- In one locked Postgres transaction, verify an active helper and their accepted assignment, enforce booking state/code expiry/active lock, update the attempt counter, and on success set both the assignment check-in and booking `in_progress` state. Replaying an already completed check-in is safe.
- Store the attempt threshold and lock duration in `app_config`. After a lock expires, reset the attempt counter before counting new attempts. A new lock writes a PII-free audit event; admin email notification is deferred to Stage 4.2.
- Host code issuance remains server-generated and hash-only; replacement issuance cannot clear attempts/lock and updates only while the booking is still assigned. Keep the current expiry policy and API pipeline ordering; add no Phase B behavior.

## Tests and rollout

Forward-only migration `0024_atomic_helper_check_in.sql` removes the legacy RPC, seeds the configured attempt threshold when absent, and adds the new function. Follow-up `0025_check_in_replay_result.sql` ensures only a replay with a correct code returns success after check-in. Local integration tests use disposable identities/bookings and cover role/ownership denial, direct RPC denial, expiry, lock/reset, concurrency, atomic state update, wrong-code replay, and correct-code replay. `0001_init.sql` and earlier migrations remain immutable.
