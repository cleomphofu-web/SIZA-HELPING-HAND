---
name: siza-product-domain
description: SIZA business rules, glossary, roles, booking state machine, reveal rules, fair rotation, check-in code, confirmation lock and subscription gate. Use before writing or reviewing any feature, query, UI copy or test that touches hosts, cleaners, bookings, offers, reviews, reports, or the cleaner subscription.
metadata:
  origin: SIZA
---

# SIZA Product Domain

Full detail lives in `docs/SIZA-v2-spec.md`. This is the always-in-context summary. If unsure, read the spec section named in brackets.

## Glossary (use these words in code, UI and copy)
- **Helper** is the word for the worker everywhere (code: `helper`). Older text that says cleaner means helper. Services: home cleaning (incl. Airbnb turnover), office cleaning, garden, handyman, custom; each has a pricing mode `rate_card | host_budget | quote`.
- **Host**: person who requests cleaners. **Cleaner**: approved worker (later: "worker" for other categories). **Request**: a booking before assignment. **Assigned**: all slots filled. **Check-in code**: 6-digit code the host gives the cleaner on arrival. **Offer window**: the period when only rotation-selected cleaners see a job.
- Never use "guarantee", "insured", "background checked", "secure payment" unless the code and legal text support it.

## Roles
One role per user: `host | cleaner | admin`. Separate route groups and layouts per role. Admin is a single owner account with MFA. [spec 3]

## Booking state machine [spec 6.1]
`open → assigned → (awaiting_payment → paid)[Phase B] → in_progress → completed`.
`open|assigned|awaiting_payment → cancelled`. `paid|in_progress|completed → disputed`. `open` older than 48 h or past start → `expired`.
All transitions go through ONE function (`transition(booking, event)`) with an allow-table. Never set `status` directly elsewhere.

## Reveal rules [spec 6.4]
- Before assignment: cleaners see suburb, transport allowance, pay, date/hours, services, host first name and rating (Phase A: completed-job count, reviews arrive in Phase B). Hosts see cleaners' public profile only.
- After assignment (Phase A) or payment (Phase B): assigned cleaners see full address, host first name and phone; host sees the assigned cleaner's phone.
- Never public: cleaner phone, surname, address, ID data. Enforce in one redaction function per entity (`server/views/*`), never in the UI.

## Fair rotation, then first-accept [spec 6.3]
Rank eligible cleaners by completed jobs in last 30 days (ascending), then longest since last job, random tiebreak. Offer to top 3 per slot for `offer_window` (default 10 min); afterwards all eligible cleaners see it; the first accept wins via one atomic conditional update. Declining has no penalty.

## Check-in code and no-show [spec 6.5]
6-digit CSPRNG code, store only an HMAC hash, 5 wrong attempts locks 15 min, expires 12 h after end. No check-in `no_show_minutes` after start: host may cancel with full refund, cleaner gets a strike, job reopens.

## Confirmation lock [spec 6.8]
A party who has not confirmed a finished job (after `confirm_grace_hours`) cannot create/accept new jobs. The lock only binds the party who has not confirmed. Auto-complete at `auto_release_hours`.

## Pricing [spec 6.6]
Recommended pay = rate card arithmetic (no AI, no negotiation). Price is locked on the booking at creation. Workers accept or decline; no counter-offers. Extra time only by in-app extension approved by the host.

## Cleaner subscription [spec 6.7]
First job free (counts only with check-in + host confirmation or auto-release). Then prepaid period; never a stored card or debit order; reminders at 5, 2, 0 days; 3-day grace; then the paywall, enforced server-side on accept.

## Duplicate-account defence
Unique normalised phone; unique `id_hash` (HMAC of full ID number, key outside the DB, kept after photos are deleted); admin duplicate flag; suspended/declined for fraud cannot re-register.

## Checklist before you finish a domain task
- [ ] Transition goes through the state machine; illegal moves tested.
- [ ] Redacted view used; unassigned cleaner cannot read the address (test).
- [ ] Numbers come from config tables.
- [ ] Copy uses the glossary and passes the copy lint.
