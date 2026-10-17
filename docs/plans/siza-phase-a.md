# Blueprint: SIZA Phase A (core flow, no money held by SIZA)

**Objective:** Ship a working SIZA for a pilot in 1-2 Johannesburg suburbs: hosts request cleaners, approved cleaners are offered jobs on a fair rotation and the first to accept wins, addresses are revealed only after assignment, a check-in code proves arrival, and cleaners pay a prepaid subscription after their first confirmed job.
**Sources:** `docs/SIZA-v2-spec.md` (v2.1), `AGENTS.md`, the `siza-*` skills, `docs/EXTERNAL_SKILLS.md`.
**Decisions kept as originally agreed:** light private ID check, fair rotation then first-accept, SIZA-calculated recommended pay with floor, host never negotiates, fee never taken from worker pay, prepaid subscription (no debit order), check-in code, confirmation lock, no AI.
**Legal track:** per your instruction legal work is deferred. It does not block building. It does block Step 12 (real users): the items are listed in "Deferred, not dropped" at the end so they are not forgotten.
**Mode:** direct (no git yet). With a repo: one branch and PR per step, `step-NN-slug`.

## In scope (Phase A)
Accounts and roles, host profile, cleaner profile + approval, booking request with locked price, rotation + atomic accept, reveal rules, WhatsApp hand-off, check-in code, no-show handling, confirmation lock, auto-complete, reports, admin (cleaners, bookings, reports, overview, rate card and config editing), cleaner subscription gate with manual payment marking and reminders, landing pages, retention jobs, security review.
## Out of scope
Card payments, ledger, payouts, reviews and ratings (Phase B), tips, chat, trade categories, maps, SMS, any AI.

## Inputs only you can give (Step 0)
| # | Input | Default if you do not decide |
|---|---|---|
| 1 | Suburbs for the pilot (1-2) and transport zones with amounts | none: required |
| 2 | Rate card: hourly rate per service, minutes per bedroom/bathroom/add-on | none: required |
| 3 | Subscription price and period (30 days default), grace days | period 30, grace 3, price required |
| 4 | Minimum pay per hour and `floor_percent` | floor 100% of recommended |
| 5 | Service list (cleaning only at launch) and job titles | standard, deep, Airbnb turnover, laundry, windows, oven, fridge |
| 6 | Offer window, no-show minutes, confirm grace, auto-release, strike limit | 10 min, 30, 12 h, 24 h, 3 |
| 7 | WhatsApp group link, admin email, support email/phone | required |
| 8 | Domain and sending address for email | required |
| 9 | Subscription payment method in Phase A | manual EFT with reference; admin marks as paid (no provider integration) |
| 10 | Design interview answers and assets (logo SVGs, hero video ID/poster) | placeholders |
| 11 | Hosting and Supabase plan (paid recommended; free tiers can pause or restrict commercial use) | paid |

## Answers received (2026-10-15) and what they change
| Item | Your answer | Effect on the plan |
|---|---|---|
| Area | Johannesburg and the Vaal | Two regions in the data (`suburbs.region`); each suburb has transport zone and an `enabled` flag; a suburb opens to hosts only after 3 approved cleaners. Long distances between regions use the highest transport zone |
| Rate card | You asked me to help | Draft in `SIZA-rate-card-draft.md` (validate with 5 cleaners and 5 hosts per region) |
| Subscription | R100 per 30 days until Phase B is published | Seed `app_config`; first job free |
| Admin and support email | sizahelpinghand@gmail.com | Used as support contact and admin notification address |
| Sending email | Gmail address for now | Not possible to send app emails from a gmail.com address through Resend: it needs a domain you own (SPF/DKIM). Buy a .co.za domain (about R99 a year) before Step 4's email work; keep the Gmail as the reply-to and admin inbox |
| Hosting | Vercel, Netlify or Cloudflare | Recommend Vercel Pro for launch (see costs). The upload code uses `sharp`, which needs a Node runtime; Vercel and Netlify functions run it, Cloudflare Workers as far as I know do not |
| Supabase | Upgrade before publish | Develop on the local Supabase stack or free project; paid plan before real users |
| Subscription payment | Concern about EFT reversal; asked about 1Voucher or direct payment | Phase A: direct EFT to the SIZA account with a unique reference; admin marks paid **only after the money shows as cleared in your own bank app, never from a screenshot**. 1Voucher goes into Phase B with a payment gateway |
| Phase B trigger | You asked how many jobs | See "Phase B gate" below |
| Skills | Agent must use the skills to decide how to code | New "Skill-first protocol" section below |

## Invariants (check after every step)
1. Everything in `AGENTS.md` hard rules and `siza-*` skills holds.
2. No money handled by SIZA code; no Phase B tables or provider logic beyond the interface stub.
3. RLS on every table, no public policies; anon client fails everywhere.
4. Gate green: `typecheck`, `lint`, `test`, `npm audit --audit-level=high`.
5. Copy lint passes; mandatory notices present where required.
6. Fake data only until Step 12.
Stop after every step for your review.

## Skill-first protocol (mandatory for every step)
For each step the agent must, in this order: (1) load the skills listed below, (2) write the listed design document(s) into `docs/` **before any code**, (3) stop for your approval where marked **[OK]**, (4) build and test from those documents, (5) update the documents if reality changes, (6) finish with `verification-loop` and the hand-off note. The agent decides its approach from the skills, not from memory. If this table and a step's own "Skills" line differ, this table wins.

| Step | Skills to load | Write first (in `docs/`) |
|---|---|---|
| 0 / 2 Design and landing | siza-design-fidelity, ui-ux-pro-max, siza-brand-voice-and-copy, frontend-a11y | `design-reference/DESIGN_TOKENS.md` **[OK]**, `copy-deck.md` (all public text and mandatory notices) **[OK]**, `design-reference/template-scrub-list.md` |
| 1 Foundation | siza-architecture, architecture-decision-records, siza-agentic-workflow, siza-security-privacy | `architecture.md` **[OK]** (folder tree, boundaries, request flow, config, jobs, errors), `adr/001-stack.md`, `adr/002-dependencies.md`, `adr/003-hosting-and-regions.md` |
| 3 Schema and RLS | siza-database-supabase, postgres-patterns, database-migrations, intent-driven-development | `data-model.md` **[OK]** (ER diagram, constraints, RLS matrix by role, SQL function specs, retention) |
| 4 Core libraries and email | siza-api-design, api-design, error-handling, siza-security-privacy, siza-testing-tdd | `api-contracts.md` (every action and route: input schema, authorization, errors, idempotency, rate-limit bucket), `pricing-and-rotation.md` |
| 5 Auth | security-review, siza-security-privacy | `threat-model.md` (assets, attackers, abuse cases, each mapped to a test) **[OK]** |
| 6 / 7 Host and cleaner flows | siza-product-domain, siza-frontend, ui-ux-pro-max, frontend-a11y, intent-driven-development | `ux/host-flow.md`, `ux/cleaner-flow.md` (screens, four states each, copy), `acceptance/step-6.md`, `acceptance/step-7.md` |
| 8 Offers and check-in | siza-product-domain, siza-database-supabase, intent-driven-development, ai-regression-testing | `acceptance/step-8.md` including race-condition and abuse cases **[OK]** |
| 9 / 10 Subscription and admin | siza-product-domain, siza-frontend, ui-ux-pro-max | `acceptance/step-9.md`, `ux/admin.md`, `runbooks/subscription-payments.md` (how to verify cleared EFT) |
| 11 Hardening | security-review, verification-loop, production-audit, santa-method | `SECURITY_REVIEW.md` **[OK]**, `DEPLOY_CHECKLIST.md`, `runbooks/breach.md`, `runbooks/restore.md`, `ADMIN_GUIDE.md` |
The UX blueprint (`docs/ux/ux-blueprint.md`) is an input to Steps 2, 6, 7, 9 and 10: the agent turns it into the `ux/*.md` and `acceptance/*.md` documents above and must not invent screens that are not in it without asking.
Every step also uses: siza-agentic-workflow, siza-testing-tdd, tdd-workflow, conventional-commit-review. Install Tier 2 skills (`--with-later`) before Step 8.

## Which model for which step (your tools)
I do not know how Luna 6, Luna 5.6, Terra 5.6 or Gemini 3.8 behave, so do not trust my ranking of them: test them (bake-off below). The rule that matters is **match the risk to the model, and make the task small and written down.**
| Tier | Work | Use |
|---|---|---|
| S: security and correctness critical | Step 3 (schema, RLS, SQL functions), Step 4 crypto, uploads, pricing and rotation, Step 5 (auth), Step 7 (documents and approval), Step 8 (accept, reveal, check-in, locks), Step 11 (review) | Your strongest model (Claude Opus 4.6 in Antigravity is the one I can vouch for), or any model that wins the bake-off |
| M: feature work from a written step document | Steps 1, 6, 9, 10, component logic | Sonnet 4.6, or the mid Codex model that does well in the bake-off |
| L: mechanical work from a precise spec | Porting components from tokens and screenshots (Step 2), copy changes, tests from a written list, docs, formatting | The cheapest models that pass the bake-off (for example Gemini 3.8 Flash mid or high) |
Rules: (1) **never let a cheaper model change migrations, RLS, auth, uploads or crypto without a review from a stronger or different model**; (2) code written by one model family is reviewed by another (cross-model review catches blind spots); (3) smaller models get smaller tasks: one component or one function per task, files and tests named up front, from the step documents in `docs/`; (4) always run the gate commands, never trust "done".
**Bake-off (about half a day):** give every model you own the same task: Step 1's `lib/env.ts` with tests plus the import-boundary lint rule, from the same step document. Score each: tests and lint pass first time (0-2), followed the skills and boundaries (0-2), added no unapproved dependency (0-1), hand-off note quality (0-2), correction rounds needed (fewer is better), time and cost. Then a second task for the cheap tier: build the Nav component from the tokens and compare with `visual-diff`. Put the winners per tier in `docs/model-routing.md`.

## Dependency graph
```
0 inputs + design interview
 └► 1 foundation
     └► 2 landing + legal placeholders ── GATE: you approve the landing page ──┐
                                                                                ▼
                  ┌──────────────────────────┬─────────────────────────────────┐
                  3 schema + RLS + SQL fns   4 core libs + email module   (parallel)
                  └──────────────┬───────────┘
                                 5 auth + roles + abuse controls
                       ┌─────────┴─────────┐
                       6 host flow         7 cleaner flow + admin approval   (parallel)
                       └─────────┬─────────┘
                                 8 offers, accept, reveal, check-in, confirm
                       ┌─────────┴─────────┐
                       9 subscription gate  10 admin ops + reports            (parallel)
                       └─────────┬─────────┘
                                 11 hardening, jobs, E2E, deploy
                                 12 pilot (needs your legal items)
```
Parallel groups: {3, 4}, {6, 7}, {9, 10}. You may waive the landing gate so 3 and 4 start earlier; the spec's default is to show the landing page first.
Model tier: strongest for 3, 4 (crypto/uploads), 5, 7 (uploads/approval), 8, 11; default for the rest.

---

## Step 0: Inputs and design interview (no code) | Owner
Complete the inputs table. Run the design interview (3-5 questions per round) and produce `docs/DESIGN_BRIEF.md` with tokens and motifs (taken from the Framer template via `tools/design`, see `siza-design-fidelity`). Gather assets.
**Exit:** inputs 1-8 and 11 answered; brief approved.

## Step 1: Foundation | Size M | Skills: siza-architecture, siza-security-privacy, siza-agentic-workflow
**Brief:** Next.js App Router + TypeScript strict + Tailwind; Supabase local stack; Vitest; Playwright later. Layout per `siza-architecture`.
**Tasks:**
- [ ] Scaffold, pin versions, `src/` layout, route groups `(public) (host) (cleaner) (admin)`, `server/` with `import 'server-only'`.
- [ ] ESLint `no-restricted-imports` (components cannot import `server/**`; only `server/db` creates Supabase clients).
- [ ] `lib/env.ts` Zod-validated env (fails fast); `.env.example`; `.gitignore` covers `.env*`.
- [ ] Security headers and CSP (Supabase, Turnstile, YouTube-nocookie only), HSTS.
- [ ] Structured logger with field allowlist; Sentry with PII scrubbing; `AppError` and `Result` types; incident-id error page.
- [ ] CI script: typecheck, lint, test, audit.
- [ ] Add `tools/design` and dev dependencies (playwright, pngjs, pixelmatch); place the Framer export and extraction output under `docs/design-reference/` (excluded from build, lint and tests). Install skills (`node tools/install-external-skills.mjs`), copy docs to `docs/`.
- [ ] ADR-001 stack and ADR-002 dependencies (each package justified: zod, @supabase/ssr, @supabase/supabase-js, sharp, resend, @sentry/nextjs, vitest, playwright).
**Verify:** build passes; missing env var fails loudly (test); headers test; import-boundary lint test (a client file importing `server/` fails).
**Exit:** all green. **Rollback:** delete scaffold.

## Step 2: Landing pages and legal placeholders | Size M | Skills: siza-design-fidelity, ui-ux-pro-max, siza-frontend, siza-brand-voice-and-copy, frontend-a11y
**Design source:** the Framer template (https://siza.framer.website/), exported home and contact pages, plus screenshots and tokens from `tools/design`. Order: tokens (owner approves `DESIGN_TOKENS.md`) -> fidelity pass with template text -> content pass with `copy-deck.md` -> scrub the template leftovers list. The About page follows `SIZA-about-page.md`.
**Brief:** Host landing `/`, `/for-cleaners`, `/how-it-works` (with the exact payment notice for Phase A), "How we vet" listing only the checks actually done, `/privacy` and `/terms` with `{{LEGAL_TEXT_PENDING}}`. Hero video after `load`, poster-only for reduced motion/data saver. CTA "Request cleaners".
**Tasks:** TDD the `HeroVideo` component and copy-lint test; build pages from `DESIGN_BRIEF.md`; no stock photos of people.
**Verify:** 375 px, AA contrast on the template's palette, LCP under 2.5 s throttled 4G (video excluded), keyboard pass, copy lint, banned-claim scan.
**Exit / GATE:** you approve the landing page in a browser. Nothing behind it starts first.

## Step 3: Schema, RLS, SQL functions | Size L | Skills: siza-database-supabase, postgres-patterns, database-migrations, siza-testing-tdd | Strongest tier
**Brief:** Spec section 6 Phase A tables only: `profiles`, `host_details`, `cleaner_details` (with `category_id`, `id_number_encrypted`, `id_hash`, `strikes`, `subscription_*`), `cleaner_private_docs`, `service_categories`, `bookings` (with `pay_per_worker_cents`, `transport_per_worker_cents`, `check_in_code_hash`, `idempotency_key`), `booking_slots`/`booking_assignments`, `booking_offers`, `reports`, `audit_log` (append-only), `admins`, `app_config`, `rate_card`, `transport_zones`, `rate_limits`, `subscription_payments` (manual marks: amount, reference, period, marked_by).
**Tasks (tests first):**
- [ ] Migrations with constraints, enums, indexes on all foreign keys, `unique(phone)`, `unique(id_hash)`, `unique(booking_id, cleaner_id)`.
- [ ] RLS on, grants revoked, `is_admin()` helper, private storage buckets.
- [ ] SQL functions: `claim_slot`, `rate_limit_hit`, `register_code_attempt`, `transition_booking` (table-driven allowed moves).
- [ ] Triggers: append-only on `audit_log`.
- [ ] Seed `app_config`, `rate_card`, `transport_zones`, `service_categories` from Step 0 inputs.
**Verify:** RLS matrix for every table (anon, wrong role, owner, admin); 20 parallel `claim_slot` calls give one winner; illegal transitions raise; audit update/delete raises; migration applies from scratch.
**Exit:** all green. **Rollback:** down-migrations on dev DB only.

## Step 4: Core libraries and email module | Size L | Skills: siza-security-privacy, siza-api-design, siza-testing-tdd | Strongest tier | parallel with 3
**Tasks (pure code, tests first):**
- [ ] `money` (cents, ZAR formatting), `phone` (E.164 from 082 123 4567, 0821234567, +27821234567), dates (UTC, Africa/Johannesburg).
- [ ] Zod schemas: booking, host profile, cleaner application, report; `.strict()`, length limits, allow-lists, start not in past, end after start.
- [ ] SA ID number validator (13 digits, valid date, check digit) and DOB-matches-ID and 18+ check.
- [ ] Crypto: AES-256-GCM encrypt/decrypt (random IV, tamper detection); HMAC helpers for `id_hash` and check-in code; secure random 6-digit code.
- [ ] Upload pipeline: magic bytes (jpg, png, webp), 8 MB cap, re-encode with `sharp`, strip EXIF, random object names, all-or-nothing rollback helper.
- [ ] Pricing: `recommendedPay(booking)` from rate card and transport zone (integer maths); floor check.
- [ ] Rotation: `rankEligible`, `offerVisibility(now)`.
- [ ] State-machine module wrapping `transition_booking`.
- [ ] Rate limiter wrapper over `rate_limit_hit`; Turnstile verify (fails closed); honeypot.
- [ ] Email module (Resend), idempotent sends keyed by event id; templates with no sensitive data.
**Verify:** unit tests per item including hostile inputs; encrypt round-trip and tamper; EXIF removal test; rotation ordering with fake clock; log-redaction test.
**Exit:** all green, no secrets in logs (grep test).

## Step 5: Auth, roles, abuse controls | Size M | Skills: siza-security-privacy, siza-api-design, security-review
**Tasks:**
- [ ] Supabase Auth via `@supabase/ssr`; server authorization with `getUser()`; `requireUser`, `requireRole`, `requireAdmin`.
- [ ] Sign-up per role with consent records (terms, privacy, public-profile for cleaners) and versions; cleaners enter DOB (18+).
- [ ] No-enumeration responses for sign-up/sign-in; lockout 5 per 15 min.
- [ ] Admin MFA (verify provider support; if unavailable record the exception in an ADR).
- [ ] Per-role layouts and navigation; role chosen at sign-up and fixed.
**Verify:** wrong role gets redirected/404; unauthenticated blocked; enumeration test (same response); lockout test; consent rows stored with versions.
**Exit:** all green.

## Step 6: Host flow | Size M | Skills: siza-frontend, siza-api-design, siza-product-domain | parallel with 7
**Tasks:**
- [ ] Onboarding (name, cell, default address, suburb from list) and profile edit.
- [ ] Booking form: services checklist, cleaners needed, date/time, estimated hours, access notes, gender preference, pay per worker (prefilled from recommendation, editable upward only per floor), transport allowance (suggested per suburb, editable upward).
- [ ] Three mandatory notices next to the button; idempotency key; price locked server-side on create (never trust client price).
- [ ] Host requests list and detail with status; cancel (free before assignment).
- [ ] Admin notification email once per new request; rotation offers created on create.
- [ ] Confirmation lock check on create.
**Verify:** client-sent price below floor rejected; double submit gives one booking and one email; honeypot saves nothing; 11th request 429; notices present (copy lint); host cannot read another host's booking.
**Exit:** all acceptance tests green.

## Step 7: Cleaner flow and admin approval | Size L | Skills: siza-security-privacy, siza-legal-guardrails, siza-frontend | Strongest tier | parallel with 6
**Tasks:**
- [ ] Cleaner onboarding: public profile fields (first name, selfie, title, services, suburbs, bio), private (surname, phone), ID photo, selfie-with-ID, ID number (validated, encrypted), one reference; consent checkbox with the exact public-profile text.
- [ ] All-or-nothing upload with rollback; duplicate checks (`phone`, `id_hash`) with identical responses for new vs existing.
- [ ] Admin cleaners queue (pending/approved/declined/suspended), detail with documents via 60 s signed URLs, duplicate flag.
- [ ] Approve: server-side blocked unless the three checklist items you actually perform are ticked; stores `vetted_at`; erases `id_number_encrypted`, keeps `id_hash`; sends one approval email with the WhatsApp link; repeat approve is a no-op; separate "resend email" action; decline with reason; audit log entries.
- [ ] Pending cleaners cannot see jobs.
**Verify:** wrong file types and over-size create nothing; forced mid-flow failure leaves no files or rows; approve fails with any box unticked when called directly; repeat approve sends nothing; declined/suspended ID hash cannot re-register; documents unreachable without admin.
**Exit:** all green.

## Step 8: Offers, accept, reveal, check-in, confirmation | Size L | Skills: siza-product-domain, siza-database-supabase, siza-api-design | Strongest tier
**Tasks:**
- [ ] Jobs list: cleaners see only offered jobs during the window, all eligible after; shows suburb, transport, pay, host first name and completed-job count; never the address.
- [ ] Accept: atomic `claim_slot`; clear "already taken" message; partial fills ("2 of 3"); booking becomes `assigned` when all slots fill.
- [ ] Reveal: redaction views; after assignment cleaner sees address and host phone, host sees cleaner phone; WhatsApp links; WhatsApp-ready job summary without client contact details.
- [ ] Check-in code: generated on assignment, shown to host and emailed, cleaner enters on arrival; 5 attempts then 15-minute lock and admin alert; expiry.
- [ ] No-show: after `no_show_minutes` host may cancel with a strike for the cleaner and the job re-opens to rotation.
- [ ] Complete: both confirm, or auto-complete at `auto_release_hours`; confirmation lock applied to the unconfirmed party only; reminders queued.
- [ ] Decline never penalises (test).
**Verify:** 20 parallel accepts, one winner per slot; unassigned cleaner cannot read address or host phone; wrong code counts and locks; lock binds only the unconfirmed party; auto-complete fires with fake clock; strike only for no-show.
**Exit:** all green; Playwright flow host requests, cleaner accepts, address revealed only to that cleaner.

## Step 9: Subscription gate | Size M | Skills: siza-product-domain, siza-api-design | parallel with 10
**Tasks:**
- [ ] `first_job_completed_at` set only when check-in recorded and completion confirmed or auto-completed.
- [ ] Accept refused server-side without an active subscription after the first job; jobs list shows the paywall with price and bank reference.
- [ ] Admin marks a payment received (amount, reference, period) which extends `subscription_paid_until` by one period from the later of today and the current end; audit logged; cleaner can pay 1, 3 or 6 periods.
- [ ] Reminders (email + in-app banner) at 5, 2 and 0 days; 3-day grace; lapse job.
**Verify:** first free job counts only with check-in; accept refused when lapsed; extension maths including early payment; reminders sent once.
**Exit:** all green.

## Step 10: Admin operations and reports | Size M | Skills: siza-frontend, ui-ux-pro-max, siza-api-design | parallel with 9
**Tasks:**
- [ ] Admin bookings list/detail (status, urgent flag when unassigned near start, re-offer, manual assign for emergencies with audit entry).
- [ ] Reports: any party can file with category and text; admin queue with status, resolve or dismiss, suspend user, notes; a report freezes auto-complete on that booking.
- [ ] Overview: counts (hosts, cleaners by status, bookings by status, open requests), jobs per cleaner, approved cleaners per suburb, database size and row counts with an "approaching limits" indicator.
- [ ] Editors for `app_config`, `rate_card`, `transport_zones` with validation and audit log.
**Verify:** non-admin blocked on every admin route and action; report freezes auto-complete; config edits validated and audited.
**Exit:** all green.

## Step 11: Hardening, jobs, E2E, deploy | Size L | Skills: security-review, verification-loop, ai-regression-testing, production-audit (+ santa-method) | Strongest tier
**Tasks:**
- [ ] Scheduled jobs: delete ID photos and selfie-check files 30 days after decision, expire old open bookings, auto-complete, lapse subscriptions, send reminders; each idempotent; one authenticated cron route plus pg_cron for database-only work.
- [ ] Rate limits tuned; Turnstile fail-closed tested in staging.
- [ ] `SECURITY_REVIEW.md` with pass/fail/unsure for every item in spec section 11 and the skills' checklists; independent review of auth, RLS, uploads and crypto code (second reviewer or `santa-method`).
- [ ] Playwright E2E for the five main flows; backup/restore drill; key rotation note; `docs/DEPLOY_CHECKLIST.md` and `docs/ADMIN_GUIDE.md` (approvals, WhatsApp group set to "approve new members", marking payments, handling reports, where the encryption key backup lives).
- [ ] Production env, domain, email DNS (SPF/DKIM), Sentry, uptime check.
**Exit:** zero unresolved fails; reviewer sign-off.

## Step 12: Pilot | Owner + you
Real users only after the "Deferred, not dropped" items below are done. Launch to 1-2 suburbs, run the subscription gate, record metrics: requests per week, share accepted within 30 minutes, median time to accept, completion rate, repeat hosts, no-show rate, active approved cleaners, subscription conversions. **Phase B gate (recommended):** start Phase B only when ALL hold over at least 6 weeks: 30 or more completed jobs (both confirmed, check-in recorded); at least 15 different hosts and 5 repeat hosts; at least 10 cleaners who completed a job; median time to accept 30 minutes or less; no-show rate 5% or less; fewer than 5 reports per 100 jobs; at least half of cleaners who finished their first job paid their first R100; and the legal and accounting items are done. If these are not met, keep improving Phase A instead.

## Deferred, not dropped (before Step 12)
Information Officer named and registered, privacy notice and terms from a lawyer (replace `{{LEGAL_TEXT_PENDING}}`), lawyer view on worker status, retention of `id_hash`, selfies as biometric data, insurance position, company registration, tax/VAT registration. The build does not depend on these; real users do.

## Self-review
Every Phase A item in the spec maps to a step. Known assumptions to confirm: subscription collected by manual EFT in Phase A; ratings replaced by completed-job count until Phase B; admin MFA depends on provider support; pg_cron and scheduled routes depend on your plan. Review was done by me, not an independent reviewer: run `santa-method` on this file if you want a second pass.

## Mutation log
- 2026-10-14: created. Landing gate kept ahead of backend per spec; reviews moved wholly to Phase B.
