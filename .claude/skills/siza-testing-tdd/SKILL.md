---
name: siza-testing-tdd
description: SIZA testing standards: TDD workflow, required test categories (RLS, authorization, concurrency, state machine, uploads, webhooks, ledger, copy lint), tooling and definition of done. Use when writing any code or tests, fixing a bug, or reviewing whether work is complete.
metadata:
  origin: SIZA
---

# SIZA Testing and TDD

## Loop (every task)
1. Write a failing test that states the behaviour (including the abuse case).
2. Run it; confirm it fails for the right reason.
3. Write the minimum code to pass.
4. Refactor with tests green.
5. Run the full gate: `npm run typecheck && npm run lint && npm test && npm audit --audit-level=high`.
Bug fixes start with a test that reproduces the bug. Never weaken or delete a test to make it pass; if a test is wrong, say why in the PR.

## Tooling
Vitest (unit + integration), Playwright (a few end-to-end flows), local Supabase (`supabase start`) for database tests with real JWTs for host, cleaner, admin and anon. Do not mock the database in RLS, authorization or concurrency tests: the point is to test Postgres.

## Required categories
1. **RLS**: for every table, anon denied, wrong role denied, owner allowed, admin allowed.
2. **Authorization**: each server action with unauthenticated, wrong role, wrong owner.
3. **Reveal rules**: a cleaner not assigned can never read the address or the host phone; before assignment only suburb is visible.
4. **State machine**: every legal transition passes, every illegal one throws (table-driven).
5. **Concurrency**: 20 parallel accepts, exactly one winner per slot; one cleaner cannot take two slots.
6. **Rotation**: ranking and visibility window (before/after `expires_at`), declined job no penalty.
7. **Check-in code**: correct code works, wrong code counts, 5 attempts lock 15 min, expiry.
8. **Confirmation lock and auto-release**: lock binds only the unconfirmed party.
9. **Subscription gate**: first job free only with check-in + confirmation; accept refused server-side when lapsed; extending `paid_until` math.
10. **Uploads**: wrong type, over 8 MB, executable renamed `.jpg`, EXIF stripped, rollback leaves no row or object.
11. **Rate limits and idempotency**: 11th request blocked; double submit gives one row and one email.
12. **Privacy**: no secrets/PII in logs (assert on captured log output); retention job deletes what it should and keeps `id_hash`.
13. **Copy lint**: banned patterns absent; mandatory notices present.
14. **Phase B only**: webhook signature/replay/amount, ledger append-only and reconciliation after pay/refund/payout.
15. **E2E (Playwright)**: host requests → cleaner accepts → only that cleaner sees the address → check-in → both confirm.

## Style
Test names read as sentences ("cleaner who is not assigned cannot read the address"). Arrange-Act-Assert. One behaviour per test. Factories for data; no shared mutable fixtures. Deterministic: fake timers for expiry/offer windows; seed randomness for rotation tie-breaks.

## Coverage
Aim for 80%+ overall and 100% on `transition`, authorization policies, redaction views, money maths and ledger functions. Coverage is a floor, not a goal; the required categories above matter more.

## Definition of done
All required categories relevant to the task exist and pass; the full gate is green; you ran the commands (do not claim results you did not see); manual check at 375 px and keyboard for UI tasks; hand-off note written.
