# ADR 011: Atomic helper no-show transition

**Status:** Accepted for Phase A implementation; the owner approved closing only the vacant slot after the configured 60-minute recovery window.

## Context

The existing host no-show service writes assignment status, helper strike, booking status, offers and audit in separate requests. A partial failure can leave those records inconsistent, and concurrent retries can increment a strike more than once. Multi-helper bookings also require unaffected assignments and check-ins to survive the no-show.

## Decision

Record the no-show in one service-role-only Postgres transaction. The function rechecks persisted host role and ownership, timing configuration, booking and assignment state under locks. It records `no_show_at`, changes only the selected assignment, increments one helper strike, reopens the request for that slot, and appends one audit event. A wrapper retains `assigned` if another accepted helper still owns a slot, while `in_progress` stays `in_progress`. Replays return the recorded result without repeating side effects. A no-show assignment remains historical while its slot may be claimed by a different eligible helper.

The helper reader and claim function share the reopened-slot rule. A fresh offer round is created only for the reopened slot, using the configured rotation lookback. An assigned or in-progress booking may expose and accept only a currently free slot with no-show history; a replacement claim does not regress booking status. When no-show occurs before another helper checks in, the aggregate booking remains `assigned` if another accepted helper still owns a slot, preserving that helper's host/helper check-in flow. The host view continues to reveal those helpers' contact details. Recovery readiness is read using the database clock; browser time is not authoritative. No-show assignment history is retained, and other assignments/check-ins are never rewritten by this transition.

The host's follow-up after 60 minutes records `proceed_fewer` or `close_vacant_slot` on the no-show assignment. Either choice closes that one vacancy and blocks further claims. “Close vacant slot” cancels the booking only when no other accepted/completed assignment remains; otherwise all remaining helper work continues unchanged. `proceed_fewer` is rejected when no other helper remains assigned. The readiness read exposes separate close/proceed availability so the host is not offered an action the transaction will reject. The action is atomic, host-owned, replay-safe and audited. No host payment or refund is collected or issued.

## Consequences

- A new `booking_assignments.no_show_at` timestamp records when the configured recovery interval starts; `app_config.no_show_recovery_minutes` is initialized to 60.
- `booking_offers.offer_round` distinguishes the fresh slot-specific rotation window after a no-show. The normal booking-wide initial offer window stays unchanged.
- `app_config.rotation_lookback_days` controls the completed-job window used for normal and reopened-slot ranking; its initial value is 30.
- All no-show effects are atomic and replay-safe.
- A service-only wrapper preserves `assigned` when other helpers still have accepted slots; a service-only read returns readiness from the database clock after checking host ownership.
- Service-only host-choice and helper-offer reads use Postgres time. Host offer visibility mirrors the database's active-helper state; application-server clock drift cannot make the UI advertise “continue with fewer” without another assigned helper.
- Existing migrations are immutable; implementation uses a forward-only migration.
- Local Supabase integration tests are required. The linked project is read-only.
