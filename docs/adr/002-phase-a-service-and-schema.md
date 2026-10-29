# ADR 002: Phase A service and schema boundary

## Context

The repository has an immutable applied migration with legacy table names and a terminology bridge. Phase A needs accounts, helper approval, booking offers, assignment, check-in, reports and subscription eligibility without starting the gated Phase B money-holding work.

## Decision

Add Phase A tables and database functions through a new forward-only migration. Put business rules in `src/server/services/`, authorization in `src/server/policies/`, and role/state redaction in `src/server/views/`. Route handlers and server actions call the shared prototype guard first and then follow the documented request order.

## Alternatives rejected

- Editing `0001_init.sql`: rejected because applied migrations are immutable.
- Keeping business logic in route handlers: rejected because it would duplicate authorization and make atomic transitions harder to audit.
- Adding a payment provider now: rejected because spec section 8.1 gates holding customer funds and payouts.

## Consequences

Phase A gains a stable service seam that can use discard-only mocks locally and real Supabase services later. The new migration must be applied to a local Supabase stack and tested with real role JWTs before production use. Subscription collection remains an operational owner/provider decision, while the accept gate is enforced in code.
