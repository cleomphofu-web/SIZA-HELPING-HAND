# SIZA v2.1: Marketplace Build Spec (owner decisions applied)

Status: DRAFT. Supersedes `cleaning-app-codex-spec.md` only for sections it conflicts with. Items marked **[DEFAULT]** are the recommended choice and stand unless the owner overrides them. Items marked **[GATE]** must be resolved before the stated phase starts. Do not build past a gate.

Priorities, in order: (1) money correctness and safety of people and homes, (2) security and privacy of personal data, (3) simplicity and low running cost, (4) polish. Higher wins on conflict.

---

## 1. Product in one paragraph
SIZA is a two-sided web app in South Africa (Johannesburg first). Hosts sign up, save a profile and location, and post a request with pay and transport per helper. Approved helpers are offered jobs on a fair rotation, then the first to accept gets the job. The owner approves helpers, handles reports, and sees usage. In Phase A, hosts pay helpers directly for work, and a helper pays SIZA a prepaid subscription only after their first completed job; SIZA does not hold host funds. Card holding, release, payouts and reviews are Phase B. **No AI features anywhere.**

## 2. Build in phases (each phase is shippable and stops for owner review)

| Phase | Goal | Money in app? |
|---|---|---|
| **A: Core flow** | Accounts, helper profiles + approval, booking request, first-to-accept, WhatsApp hand-off, reports, admin basics, and the prepaid helper subscription gate after the first completed job. Hosts pay helpers directly for work. Helpers pay SIZA separately by a one-off payment; payment is recorded by the owner. SIZA holds no host funds. | No host funds held |
| **B: Payments + reviews** | Card payment held by SIZA, both-confirm release with auto-release timer, payout ledger, reviews, cancellations and refunds. | Yes |
| **C: Growth** | Tips, optional in-app chat, map pin, and other owner-approved revenue extras. | Depends on feature |

Rationale: Phase A tests whether hosts request and helpers accept, cheaply, and earns through the helper subscription (6.7), which needs no holding of anyone else's money. Phase B is the risky, regulated part and starts only after the **[GATE]** in section 8 is cleared. Do not build Phase B or C code during Phase A except the payment adapter interface stub.

## 3. Roles and routes

**Public:** `/`, `/about`, `/contact`, `/privacy`, `/terms`. Services and how-it-works are home-page sections, not separate marketing pages. `/request` redirects to host sign-up and `/apply` redirects to helper sign-up; neither has a standalone public page.
**Host (auth):** `/signup`, `/login`, `/app/onboarding`, `/app/profile`, `/app/book`, `/app/requests`, `/app/requests/[id]`, `/app/report`.
**Helper (auth):** `/helper`, `/helper/onboarding`, `/helper/profile`, `/helper/jobs`, `/helper/jobs/[id]`, `/helper/report`.
**Admin (single owner, auth + `is_admin` on every request):** `/admin`, `/admin/helpers`, `/admin/helpers/[id]`, `/admin/reports`, `/admin/bookings`, `/admin/bookings/[id]`, `/admin/revenue` (Phase B), `/admin/overview`.

A user has exactly one role chosen at sign-up. The helper application path must not share layout, navigation or state with the host flow; separate `(host)`, `(helper)` and `(admin)` route groups and separate layouts.

## 4. Flows

### 4.1 Host
1. Sign up (email + password or Google, via Supabase Auth). Accept Terms and Privacy at sign-up; store version and timestamp of acceptance.
2. Onboarding: name, cell number, default address (text: street, suburb, city) with suburb chosen from a list. Editable later. **[DEFAULT]** no map API at launch; address is text plus suburb.
3. Book: address (prefilled, editable), number of cleaners (1-4+), services from a fixed checklist (standard clean, deep clean, Airbnb turnover, laundry, windows, oven, fridge, post-construction), date and time window, estimated hours, pay per worker (ZAR, with the owner's minimum per hour), transport allowance per worker (suggested per suburb, host may raise), gender preference (any, female, male, mix), access notes. Button "Request cleaners".
4. Before submit, show three notices: (a) "Agreements made outside SIZA are not SIZA's responsibility." (b) "Your address is shared with the cleaner(s) assigned to you." (c) payment explanation (Phase A: payment is arranged directly; Phase B: how card payment and release work).
5. Request page shows status: open, accepted (cleaner profile), awaiting payment (Phase B), confirmed, completed, cancelled.
6. After the job: confirm, review, or report.

### 4.2 Cleaner
1. Sign up, accept Terms, Privacy and the public-profile notice.
2. Onboarding profile: display first name, surname (not public), cell number (not public), selfie, job title chosen from SIZA's list, services, suburbs served, bio (max 300 chars), self-reported experience, rate expectation.
3. Status `pending` until the owner approves. Pending cleaners cannot see jobs.
4. Approved cleaners see `/cleaner/jobs`: open requests (see 6.3 for who sees what and when), each showing suburb, transport allowance, pay, date and hours, services, host first name and rating (in Phase A, before reviews exist, show the host's completed-job count instead). The suburb and transport allowance let the cleaner judge whether the trip is affordable before accepting. **The exact address stays hidden until the job is assigned (and paid, in Phase B).**
5. Accept: during the offer window only offered cleaners can accept; afterwards the first accept wins, atomically (6.3). Accept fails with a clear message if taken.
6. After accepting, cleaner sees address and a WhatsApp deep link to the host. After the job: confirm and review.

### 4.3 Owner
Approve or decline cleaners with a reason, view reports, overview counts, revenue (Phase B). Details in section 9.

## 5. Decisions the owner must confirm (with recommended defaults)

1. **Cleaner vetting [CONFIRMED by owner: light private check].** ID photo plus selfie viewed by admin only (private storage, signed URLs, 60 s), plus a phone call and one reference. The applicant types the ID number; the server validates format (13 digits, valid birth date, check digit) and stores it encrypted only until you approve or decline, then erases it. What stays permanently is a keyed one-way hash (HMAC-SHA256 with a secret key held outside the database) so the same ID cannot re-apply or open a second account, even after the photos are deleted 30 days after the decision. Keeping only the last four digits was considered and rejected: they are not unique to one person, so they would block innocent people and miss cheats. The privacy notice must say the hash is kept and why; **[GATE]** the lawyer confirms this retention under POPIA. Public pages say "checked by SIZA" only for what is actually done, and Approve is blocked server-side unless the checks you perform are ticked.
2. **Fair job distribution [CONFIRMED approach: fair rotation, then first-accept].** Plain first-accept favours whoever has the fastest phone, so a few cleaners win everything. Instead, each new job is offered first to the eligible cleaners with the fewest recent jobs for a short window; after that it opens to everyone and the first accept wins (6.3). The host does not pick; the host may cancel free before paying. SIZA cannot guarantee every cleaner work (that depends on demand versus the number of approved cleaners), so the admin overview shows jobs per cleaner and approved cleaners per suburb, and the owner can pause approvals in a suburb.
3. **Public profile content.** **[DEFAULT]** public: first name, selfie, job title, services, suburbs, bio, reviews. Never public: phone number, surname, address. Cleaner phone is revealed to the host only after assignment (and payment, in Phase B). Posting phone numbers publicly invites bypass, spam and harassment.
4. **Chat.** **[DEFAULT]** no in-app chat. After assignment, each side gets a `wa.me` link to the other. Add in-app chat only in Phase C if bypass or dispute evidence justifies the cost.
5. **Tips and transport donations.** **[DEFAULT]** Phase C. Extra payment flows double the refund and dispute surface.
6. **SIZA revenue [REVISED by owner: SIZA must earn from the start; nothing is taken from the helper's work pay].** (a) **Helper subscription**, due only after the helper's first completed job (first job free, see 6.7). This is a Phase A subscription paid directly to SIZA; it does not involve or hold the host's payment to the helper. (b) Optional in Phase B: a service fee charged to the HOST on top of the helper's pay (owner sets percentage and a minimum); the helper still receives 100% of pay plus transport. **[DEFAULT]** keep the helper subscription in Phase A; add a host fee in Phase B only if costs require it. No free trial. Bookings made in SIZA must be paid in SIZA once Phase B is live (terms: no outside payment).
7. **Payment provider [GATE for Phase B].** See section 8. Owner has agreed to take legal and accounting advice on holding funds before Phase B (see 8.1).
8. **Worker pay protection [CONFIRMED need].** The only reliable way to make sure the host pays and the worker turns up is card payment up front, held by SIZA, released after completion. Cash or outside payment cannot be guaranteed by SIZA. Protections: payment before address and phone are revealed; check-in code (6.5); no-show rules with refund, strike and re-offer; ratings. Details in 6.5, 7 and 8.3.
9. **Transport.** The host booking form has a separate transport allowance per worker (SIZA suggests an amount per suburb, host may raise it, owner sets a floor) and a minimum pay per hour, so a worker is not left with less than the trip costs. Workers can see the suburb and the transport allowance before accepting.
10. **Check-in code [CONFIRMED idea].** Random code like delivery apps use at gates: see 6.5.

## 6. Data model (Postgres on Supabase)

All money is stored as integer cents (`bigint`) plus currency `ZAR`. All timestamps `timestamptz` in UTC. Row Level Security on every table, deny by default, no public policies; all writes through server routes or server actions using a server-only client.

```
profiles           (id uuid pk = auth.users.id, role enum host|cleaner|admin, first_name, last_name,
                    phone unique, avatar_path, created_at, terms_version, terms_accepted_at,
                    privacy_version, privacy_accepted_at, deleted_at)
host_details       (user_id fk, address_line, suburb, city, notes_default, updated_at)
cleaner_details    (user_id fk, category_id fk, job_title text, services text[],
                    licence_number, licence_verified_at, suburbs text[], bio, experience_note,
                    rate_note, status enum pending|approved|declined|suspended, decline_reason,
                    approved_at, vetted_at, check_notes_private, rating_avg numeric, rating_count int, strikes int default 0,
                    id_number_encrypted (nulled at approve/decline), id_hash unique, first_job_completed_at, subscription_status enum none|active|lapsed,
                    subscription_paid_until)
cleaner_private_docs (id, cleaner_id fk, type enum id_photo|selfie_check, storage_path, delete_after)
bookings           (id, host_id fk, address_line, suburb, city, services text[], cleaners_needed int,
                    start_at, end_at_est, pay_per_worker_cents bigint, transport_per_worker_cents bigint, service_fee_cents bigint,
                    check_in_code_hash, code_attempts int, code_locked_until, gender_pref enum,
                    access_notes, status enum open|assigned|awaiting_payment|paid|in_progress|
                    completed|cancelled|disputed|expired, created_at, assigned_at, completed_at,
                    idempotency_key unique)
booking_assignments(id, booking_id fk, cleaner_id fk, status enum accepted|cancelled|completed|no_show,
                    accepted_at, checked_in_at, host_confirmed_at, cleaner_confirmed_at)  unique(booking_id, slot)
booking_offers     (id, booking_id fk, cleaner_id fk, offered_at, expires_at)  -- rotation window, see 6.3
reviews            (id, booking_id, author_id, subject_id, rating 1-5, comment, created_at,
                    visible bool)  unique(booking_id, author_id, subject_id)
reports            (id, booking_id nullable, reporter_id, subject_id nullable, category enum, text,
                    status enum open|reviewing|resolved|dismissed, admin_note, created_at)
audit_log          (id, actor_id, action, entity, entity_id, at)  -- no personal data
rate_card          (id, service enum, hourly_cents, per_bedroom_minutes, per_bathroom_minutes,
                    addon_minutes jsonb, updated_at)  -- admin-editable, see 6.6
transport_zones    (suburb, region johannesburg|vaal, zone, transport_cents, enabled)  -- admin-editable; a suburb opens to hosts only with 3+ approved cleaners
service_categories (id, name, titles text[], enabled bool, requires_licence bool, pricing enum rate_card|host_budget|quote)
-- Phase B
payments           (id, booking_id, provider, provider_ref unique, amount_cents, fee_cents, status enum
                    pending|paid|refunded|failed|disputed, created_at, paid_at)
ledger_entries     (id, booking_id, kind enum host_payment|held|platform_fee|cleaner_payable|payout|
                    refund|adjustment, amount_cents, created_at, ref)  -- append-only, never updated
payouts            (id, cleaner_id, amount_cents, status enum queued|sent|failed, method, ref, sent_at)
cleaner_bank       (user_id, account_holder, bank, account_no_encrypted, branch, verified_at)
app_config         (key pk, value)  -- commission_bps, auto_release_hours, urgent_hours, etc.
```

Rules: `ledger_entries` is append-only (no UPDATE or DELETE policy, enforced with a trigger). A booking can never be `paid` without a matching `payments` row with `status = paid`. Encrypt `account_no` and any ID-like value with AES-256-GCM, key in env, never in logs.

### 6.1 Booking state machine
`open → assigned → (awaiting_payment → paid)[Phase B] → in_progress → completed`; any of `open|assigned|awaiting_payment` may go to `cancelled`; `paid|in_progress|completed` may go to `disputed`; `open` older than 48 h or past `start_at` becomes `expired`. Implement transitions in one server module (`transition(booking, event)`) with a table of allowed moves; every other code path calls it. Unit test every legal and illegal transition.

### 6.2 Multi-cleaner bookings
`cleaners_needed = n` creates n slots. Each accept claims one slot. Booking becomes `assigned` only when all slots are filled; partial fill shows "2 of 3 filled" and the host may proceed with fewer or wait.

### 6.3 Fair rotation, then first-accept (atomic)
**Rotation:** when a booking opens, find eligible helpers (approved, serves the suburb, offers every selected service, is available at that time, has no other accepted job whose time window overlaps, and passes the subscription gate). Enforce overlap exclusion when creating offers and computing helper/admin availability; recheck it transactionally during both helper acceptance and admin assignment, using a helper-scoped transaction lock so concurrent requests cannot double-book. A host may choose one optional gender preference (`female`, `male`, or `mix`). This is a soft ranking preference, never an eligibility filter: apply it only after workload and time-since-last-job fairness ordering, and keep all otherwise-eligible helpers in the candidate pool. `mix` alternates female/male preference by slot as a ranking tie-break. A helper may opt in with one self-described matching category (female or male) or leave it unset; unset helpers remain eligible. Use no names, photos, age, race, or other personal attributes for matching. The helper's matching category is private and never appears in host or admin views. Do not infer it. Rank by completed jobs in the last 30 days ascending, then by longest time since last job, then by the applicable soft gender preference, then random tiebreak. Insert `booking_offers` for the top 3 per slot needed with `expires_at = now + offer_window` (`app_config`, default 10 minutes). While the window is open only offered helpers see and can accept the job; afterwards every eligible helper sees it and the first accept wins. No background worker: visibility is computed at read time (`offered_to_me OR now() > min(expires_at)`). Unit test ranking and visibility. Gender matching consent wording and privacy notice must be owner/lawyer reviewed before real helper data is collected.

**Claim:** claim a slot with a single conditional statement in one transaction, for example `update booking_slots set cleaner_id = $1 where booking_id = $2 and cleaner_id is null returning *`, with a unique constraint on `(booking_id, cleaner_id)` so one cleaner cannot take two slots. Concurrency test: 20 simultaneous accepts, exactly one winner per slot.

### 6.4 Reveal rules (privacy)
- Before assignment: cleaners see suburb, transport allowance and pay only; hosts see cleaners' public profile only.
- After assignment (Phase A) or after payment (Phase B): assigned cleaners see the full address and the host's first name and phone; the host sees the assigned cleaner's phone.
- Enforce in the query layer (a server function returns a redacted view by role and booking state). Test that a cleaner not assigned to the booking can never read the address.

### 6.5 Check-in code
When a booking becomes assigned (Phase A) or paid (Phase B), generate a random 6-digit code with a CSPRNG, store only an HMAC hash, and show the code to the host in the app and by email. On arrival the host gives the code to the cleaner (in person, or to security at a gated complex) and the cleaner enters it in the app. That sets `checked_in_at` and moves the booking to `in_progress`. Wrong code: 5 attempts, then a 15-minute lock and an admin notification. The code expires 12 hours after `end_at_est`. Purpose: proves the right person arrived, gives proof of attendance for disputes, and starts the release clock.
No-show: if a helper has not checked in within `no_show_minutes` after start (`app_config`), mark only that helper's assignment `no_show`, issue the helper a strike, and reopen only that slot for rotation. Other assigned helpers keep their jobs. If the slot remains unfilled after `no_show_recovery_minutes` (initial value 60 in `app_config`), the host may proceed with fewer helpers or close the vacant slot free of charge. Owner decision: either choice closes only that vacant slot; other assignments remain active. “Close vacant slot” cancels the booking only if no other accepted/completed assignment remains. A host cannot proceed with fewer helpers if nobody remains assigned. The resolution state, slot closure and audit event are atomic and replay-safe. A helper no-show costs the host nothing. If the host never supplies the code, admin can resolve it as a dispute. Strike thresholds remain a configuration decision; do not hard-code one.

### 6.6 Pricing: clear hourly rates, no haggling, no AI
- Owner decision (2026-10-26): hosts set the offered hourly amount, with a R100/hour minimum. The initial service values for testing with helpers are standard clean R100/hour, deep clean R160/hour, and Airbnb turnover R155/hour; treat these as configured starting suggestions, not fixed production rates. For multiple services, add the selected service rates for the full estimated time; the primary service determines the estimated duration. Jobs are at least 3 hours per helper.
- Pricing must be deterministic and server-calculated from configured service/rate data, the primary service's duration rule, the host's selected hourly amount, and transport settings. The host may change the suggested amount but cannot set it below the configured R100/hour floor. Store the selected hourly amount and final amount on the booking so later configuration changes do not rewrite an existing request.
- Workers cannot counter-offer. They accept or decline. The price is locked on the booking when it is created (`pay_per_worker_cents`, `transport_per_worker_cents`).
- Extra time: the cleaner can request +1 hour in the app at the hourly rate; the host approves or declines; nothing extra is owed without approval (in Phase B it is charged as an add-on payment).
- Tune the rate card from pilot data (how often jobs are declined, how often hours overrun).
- Why not AI: a formula is predictable and explainable in a dispute; AI pricing costs money per call, cannot be explained to a worker who feels underpaid, and adds nothing here.
- Why not negotiation: it invites lowballing, pressure and off-app deals, and in Phase B a host who agrees a price in chat and then refuses to pay is exactly what up-front payment prevents.

### 6.7 Helper subscription gate (Phase A)
- The helper's first job is free. It counts as the "first completed job" (`first_job_completed_at`) only if the check-in code was entered (6.5) and the host confirms completion, auto-release fires, or admin resolves it. Not when the helper merely accepts.
- The helper subscription becomes due after that first completed job. Before accepting any later job, the helper needs `subscription_status = active` and `subscription_paid_until` in the future. Otherwise the jobs list shows a paywall and the accept action is refused server-side. The subscription payment is a separate payment from the host's payment for work.
- **Prepaid, never a debit order [CONFIRMED by owner].** The subscription is a prepaid period (e.g. 30 days) that the cleaner pays on purpose; SIZA never stores a card for automatic charging. Paying extends `subscription_paid_until` by one period from the later of today and the current paid-until date. Reminders by email and an in-app banner at 5 days, 2 days and on the day it ends, with a 3-day grace period; then the paywall. Terms: no refunds for a period already started. Offer 1, 3 or 6 months prepaid. Price and period are owner settings (`app_config`). Break-even: monthly running costs ÷ subscription price = subscribers needed.
- Collection: Phase A uses a one-off card or EFT payment link (no recurring token); admin can also mark a payment as received manually with a reference (audit logged). A cleaner who lets it lapse simply stops seeing new jobs until they pay again.
- **Fake-account defence** (to stop one person making many accounts for free first jobs): (1) admin approval of every account is the real gate, with ID photo, selfie and a phone call; (2) normalised phone number must be unique, but phones are only a weak signal because SIM cards are cheap; (3) `id_hash` must be unique and is kept after the photos are deleted, so waiting 30 days and re-applying fails; (4) admin sees a "possible duplicate" flag when a selfie or name looks similar to an existing account; (5) in Phase B the payout bank account must be unique per cleaner and its account-holder name must match the name on the ID; (6) a subscription payment reference or card already used by another cleaner is flagged for admin; (7) a cleaner suspended or declined for fraud cannot re-register with the same phone or `id_hash`. No method is perfect; the admin check is what makes the others work. Using someone else's real ID is the hardest case: the selfie, the phone call and the bank-name match are the defences, and a paid identity-verification service can be added later if fraud appears.

### 6.8 Confirmation lock [CONFIRMED by owner]
- A host whose booking ended more than `confirm_grace_hours` ago (`app_config`, default 12) without the host confirming or reporting cannot create a new request. A cleaner who has not confirmed a finished job after the same grace cannot accept a new job. Each person's lock clears when they confirm their own side or file a report.
- The lock only binds the party who has not confirmed. If the cleaner has confirmed and the host stays silent, the cleaner is not locked; the job auto-completes at `auto_release_hours` and the host stays locked until they confirm or report. This stops a host holding a worker hostage by not confirming.
- Reminders to the unconfirmed party: in-app banner and email at the job end time, +6 h and +12 h.
- Honest limit: the lock encourages honest confirmation but cannot prove the job was done; the check-in code, auto-release and admin dispute handling cover the rest.

## 7. Reviews, reports, disputes
- Review window opens when both confirm (or auto-release fires) and stays open 14 days. One review per author per booking. Reviews of a cleaner appear on their profile; a host's rating is visible to cleaners on the job list.
- Reviews are moderated after the fact: admin can hide (`visible = false`) with an audit entry. No editing by authors after 24 h.
- Anyone in a booking can file a report (category, text). Admin queue with status. A report on a `paid` booking automatically moves it to `disputed` and **freezes release** until admin resolves.
- **Auto-release timer [critical]:** if the host does not confirm within `auto_release_hours` (default 24) after `end_at_est`, and no report is open, the booking completes and funds become payable. If the cleaner does not confirm but the host does, completes at once. Release also requires a recorded check-in (6.5) unless admin resolves a dispute. Without this rule, one unresponsive party locks money forever.

## 8. Payments (Phase B) **[GATE]**

### 8.1 Gate: holding customer funds
SIZA collecting card payments and paying cleaners later makes SIZA the party that holds and disburses other people's money. Before Phase B code: get advice from an accountant and a lawyer on (a) whether this needs a regulated payment partner or licence, (b) VAT and tax treatment (is SIZA the seller of the cleaning service or an intermediary), (c) card refund and chargeback liability, (d) contractor vs employee status of cleaners. **Do not start Phase B until the owner confirms this in writing.** If advice says SIZA may not hold funds directly, use a provider that holds and splits funds on its side.

### 8.2 Provider facts (from research, October 2026; verify before committing)
- **PayPal: not recommended.** South African PayPal accounts cannot hold or receive ZAR (only currencies such as USD and EUR); money is converted at withdrawal with a conversion spread and withdrawals go via a linked bank. Every cleaner would need a PayPal account. Poor fit for ZAR gig pay.
- **Ozow:** instant pay-by-bank (EFT), roughly 1.5% fee per sources reviewed, very traceable, but it is not card. Good as an extra option, not a substitute for the owner's "card only" requirement.
- **PayFast:** supports cards, instant EFT and subscriptions; split payments are instant and only to other PayFast accounts (sources reviewed), which gives no "hold until confirmed". Card fees around 2.85% + R2 in sources reviewed.
- **Paystack (SA), Peach Payments, Yoco:** card gateways; confirm with each whether they offer split or delayed settlement, subaccounts, payouts API, and escrow-style hold for South African merchants. Do not assume.
- Rates and features change; get the current quote and API docs before the choice.

### 8.3 Design that keeps the provider swappable
Build a `PaymentProvider` interface now (Phase A stub):
```ts
interface PaymentProvider {
  createCheckout(input: { bookingId: string; amountCents: number; returnUrl: string; idempotencyKey: string }): Promise<{ url: string; providerRef: string }>;
  verifyWebhook(rawBody: string, headers: Headers): Promise<WebhookEvent | null>; // signature check, null if invalid
  refund(providerRef: string, amountCents: number, idempotencyKey: string): Promise<RefundResult>;
  payout?(input: PayoutInput): Promise<PayoutResult>; // only if the provider supports it
}
```
Rules:
- **Never trust the browser redirect.** Mark paid only from a verified server-to-server webhook, and also re-query the provider before releasing.
- Webhook handler is idempotent (unique `provider_ref`), verifies signature, checks amount equals expected, and ignores replays.
- Card only at launch **[DEFAULT]**. No card data touches SIZA servers; hosted checkout only (keeps PCI scope minimal).
- Amounts: `host_pays = (pay_per_worker + transport_per_worker) × cleaners + service_fee`. The cleaner receives 100% of pay plus transport; the service fee is paid by the host on top and shown as a separate line before payment. Ledger entries per payment: `host_payment`, `platform_fee`, `cleaner_payable`.
- **Payout [DEFAULT]:** Phase B1 is manual: admin sees a payable list per cleaner, pays by EFT, marks `payouts.sent` with a reference; the ledger records it. Automate only if the provider offers a payouts API and volume justifies it.
- Cancellation rules **[DEFAULT, owner to set numbers]**: host cancels before assignment: free; after assignment but more than N hours before start: full refund; later than that: partial fee goes to the cleaner; cleaner no-show: full refund and a strike. Store the policy text with the booking at the time of booking.
- Refunds and chargebacks reverse ledger entries with offsetting rows, never edits.
- Provider fees on refunds: decide who bears them and show it in the terms.

## 9. Admin
- **Cleaners:** pending/approved/declined/suspended; detail with profile, private check files (signed URL, 60 s), notes; approve (requires the checks you actually perform to be ticked, enforced server-side, stored with `vetted_at`), decline with reason. Each action writes `audit_log`.
- **Reports:** queue, status, link to booking, resolve or dismiss, hide a review, suspend a user.
- **Overview:** counts of hosts, cleaners (by status), bookings (by status), open requests, and database size and row counts per table with a simple "approaching free-tier limits" indicator. Read from Postgres statistics, no extra service.
- **Revenue (Phase B):** gross, platform fees, refunds, payable to cleaners, paid out, by date range, from `ledger_entries` only.
- **Errors:** do not build an error dashboard. Use Sentry (free tier) on server and client with PII scrubbing, plus a generic user-facing error page with an incident id.
- Owner login: MFA required; otherwise accept the exception in writing.

## 10. Stack and cost control
Keep the stack small. Every extra service is cost, a failure point, and attack surface.
- **App:** Next.js (App Router), TypeScript, Tailwind. **Hosting:** note that some free hosting tiers prohibit commercial use and Supabase free projects can pause when inactive; do not run a money-handling product on a tier that pauses. Budget a paid database plan and paid or commercial-use hosting before launch (verify current prices). **[DEFAULT]** one paid Supabase project + one paid host.
- **Auth, DB, storage:** Supabase (Auth, Postgres, private Storage). Replaces separate auth, upload and DB vendors.
- **Email:** Resend free tier is enough at start.
- **Rate limiting:** **[DEFAULT]** a Postgres-backed limiter (table with counters) for low volume, so Upstash is not needed at launch; swap later behind the same `limit()` function. Keep Cloudflare Turnstile (free) on public forms.
- **Maps, SMS, chat, AI:** none at launch. Phone numbers are not OTP-verified at launch; accept that and say so.
- **Errors:** Sentry free tier.
- **Images:** resize and compress selfies client-side to under 500 KB; limits 8 MB hard cap; jpg/png/webp only; magic-byte validation.
- Avoid heavy UI and animation libraries; the design comes from the Framer template (tokens extracted into `docs/design-reference/`): it applies fully to the public pages and as tokens to the app screens.

## 11. Security and privacy rules (apply to every endpoint)
Everything in section 7a of the earlier spec still applies (Zod on all input, RLS, rate limits, Turnstile, honeypot, no enumeration, CSP and headers, secrets in env, no sensitive data in logs, dependency pinning and `npm audit`). Additions for v2:
- Authorisation on every server action by role AND ownership (a host can only read their own bookings; a cleaner only jobs they are eligible for or assigned to).
- Redacted views by state (6.4); one function per entity returns the allowed fields, UI never filters.
- Request processing order is exact: prototype switch → rate limit → bot check → input validation → authorisation → server service → database. The proxy enforces the switch for page access; each API route and server action also invokes the same fail-closed guard before doing request work.
- Login lockout uses Postgres counters: 5 failed logins per 15 minutes for the normalized account/IP pair blocks that pair; 20 failed logins per hour for an account requires Turnstile on the next attempt and does not lock the account across IPs. Successful login clears the account and current-pair failures. Persist only HMAC digests, never raw account identifiers or IPs. Keep all thresholds/window values in `app_config`; limiter database errors fail closed. See ADR 010.
- Cancellation terms supplied by the owner: free before helper assignment and until 4 hours before the start after assignment; later cancellations or no one answering the door mean the host owes the helper the transport amount directly; a helper no-show costs the host nothing. Preserve lawyer review for final terms and make implemented state transitions match the displayed policy.
- POPIA: public cleaner profile requires explicit consent text; users can request deletion (soft-delete `deleted_at`, anonymise reviews' author name, keep ledger rows); retention periods in the privacy page. **[GATE]** owner names an Information Officer and approves the privacy text before real users sign up.
- Public pages show hosts' first name and rating only to approved cleaners; never to anonymous visitors.
- Webhooks: signature verification, replay protection, allow-listed IPs only if the provider publishes them.
- Admin sessions short-lived; admin routes behind `requireAdmin()`.
- Audit log for approvals, suspensions, review hiding, refunds, payout marks.

## 12. Testing (Vitest + a few Playwright flows)
Must-have tests, written before the code they cover:
- RLS: anon and wrong-role access denied for every table; cleaner cannot read an unassigned booking's address.
- First-accept concurrency (20 parallel accepts, one winner per slot).
- State machine: every legal and illegal transition.
- Auto-release timer and report freeze (Phase B).
- Webhook: invalid signature rejected, replay ignored, wrong amount rejected, paid only via webhook.
- Ledger: append-only enforced; sums reconcile after payment, refund and payout.
- Upload validation (type, size, magic bytes).
- Rate limits trigger; generic errors do not leak records.
- Playwright: host books → cleaner accepts → address revealed only to that cleaner.

## 13. Phase A exclusions and later-phase features
The helper subscription after the first completed job is in Phase A (6.7), not out of scope. Phase A excludes SIZA holding host funds, host card checkout/payment release, payouts, reviews, and automatic subscription debit orders. Host payments, funds holding, releases, refunds, ledger and manual payouts are Phase B features gated by section 8. Later growth features include in-app chat, tips and transport donations, map pins and distance matching. SMS OTP, native apps, any AI feature, helper-to-helper features, and multi-city remain out of scope unless separately approved. Helper subscriptions are prepaid one-off payments; they do not automatically renew.

## 14. Metrics and the Phase B gate
Track: requests per week, share accepted within 30 minutes, median time to accept, completion rate, repeat hosts, no-show rate, reports per 100 jobs, approved and active cleaners, subscription conversion.
**Phase B gate [recommended]:** over at least 6 weeks: 30+ completed jobs; 15+ different hosts and 5+ repeat hosts; 10+ cleaners who completed a job; median time to accept 30 minutes or less; no-show rate 5% or less; fewer than 5 reports per 100 jobs; at least half of cleaners who finished their first job paid their first subscription; and the legal and accounting gate (8.1) cleared. Otherwise keep improving Phase A.

## 15. Build order for the coding agent
Phase A: (1) env + headers + CI, (2) schema + RLS + tests, (3) auth + roles + route groups, (4) host onboarding and booking, (5) cleaner onboarding, admin approval, (6) jobs list + atomic accept + reveal rules, (7) reports + admin overview, (8) landing pages + legal pages, (9) security review, (10) pilot with real users. Stop after each for review. Phase B only after the section 8.1 gate and owner sign-off.

## 16. Job categories and regulated trades
- Titles are data, not a hard-coded list: `service_categories` (name, titles, `enabled`, `requires_licence`, `pricing`). Admin enables categories one at a time. Launch **[DEFAULT]** with cleaning only; add gardening and general labour once the pilot works.
- Plumbers, electricians, roofers, carpenters and similar trades are a different product: jobs are usually quoted rather than priced from hours, there is more risk and damage liability, and some work is regulated (for example, electrical and gas work generally must be done by registered people who issue compliance certificates; plumbing and work at height have their own registration and safety rules). Before enabling a trade category: `requires_licence = true`, cleaner enters licence number and admin verifies it with the issuing body, `pricing = quote` (the host posts the job, cleaners send a quote, the host accepts one), and get legal advice on liability. Do not build the quote flow or licence checks in Phase A or B.

## 17. Tax and worker status (owner to confirm with an accountant)
- Workers: the terms must say workers are independent and responsible for their own tax; SIZA does not deduct PAYE. In Phase B, give each cleaner a downloadable earnings statement from the ledger to help them file.
- SIZA: subscription and fee income is SIZA's taxable income, and SIZA must register for VAT if its turnover passes the compulsory threshold (verify the current figure with SARS). In Phase B, how money SIZA holds and pays out is treated for tax depends on whether SIZA is a principal or an agent; the accountant decides before Phase B.
- Status risk: SIZA setting prices, assigning jobs, applying strikes and removing workers all point towards control, which can make workers look like employees. Get this reviewed with the contractor/employee advice already required (8.1).

## 18. UX and terminology
The worker is called a **helper** in code, UI and copy (older sections say cleaner). Navigation, flows, screens and service model are in `docs/ux/ux-blueprint.md`: public nav About us / Request a helper / Apply to be a helper / Contact; host floating nav Home, Services, Activity, Account; helper nav Jobs, My jobs, Plan, Account; services beyond home cleaning start as coming-soon until a suburb has 3 approved helpers for them.
