# SIZA build plan: Phase A

**Purpose:** the single detailed plan for building SIZA Phase A. `docs/BUILD_STATUS.md` is the short current-state ledger and points here. Product behavior comes from `docs/SIZA-v2-spec.md`; public UX comes from `docs/ux/ux-blueprint.md`; architecture decisions live in `docs/architecture.md` and `docs/adr/`.

**Phase A outcome:** a pilot-ready, non-holding marketplace where a host requests help, approved helpers receive fair offers, one helper accepts each slot atomically, permitted details are revealed after assignment, the job is checked in and confirmed, reports reach admin, and helper subscription eligibility is enforced. SIZA does not hold customer money in Phase A.

**Hard gates:** the owner approved the design tokens on 26 October 2026. Linked Supabase is read-only unless the owner explicitly authorises a write; `0001_init.sql` is immutable; legal and security gates block real users; Phase B payment/ledger/payout work is excluded.

## Working routine for every milestone

1. **Grill with docs first:** load the named skills, read the relevant spec/blueprint, write or update the milestone design/acceptance document, and surface unresolved decisions.
2. **Implement to build:** write tests first, make the smallest change behind the documented seam, and keep the active milestone narrow.
3. **Review at the end:** run the code-review skill against standards and spec, then run the verification gate and record results.
4. **Security pairing:** use `santa-method` for auth, uploads, encryption, RLS, and other security-critical changes.
5. **Stop at the milestone gate:** update `docs/BUILD_STATUS.md`, `docs/ops-log.md` when an operation is risky, and wait for owner review unless the owner explicitly continues.

## Numbered stages and milestones

### Stage 0 — Documentation and control plane

#### 0.1 Documentation set

Create/update the architecture, API route inventory, coding-standards delta, safety policy, build ledger, and operations log. Remove `docs/appflow.md` because it was an untracked prior working note that duplicated and conflicted with the UX blueprint; `docs/ux/ux-blueprint.md` is the UX source of truth.

Acceptance: all documents link to the correct source of truth; no duplicate route or UX map remains; `AGENTS.md` gains only a three-line pointer to the build ledger and plan.

Tests/checks: documentation link/path check, structure check, diff check.

Skills: `siza-agentic-workflow`, `siza-architecture`, `api-design`, `coding-standards`, `safety-guard`, `verification-loop`.

#### 0.2 Architecture review, no refactor

Run the requested architecture-review skill and create its HTML report in the OS temp directory. Present the deepening candidates and wait for the owner to choose. Do not refactor during this milestone. The default candidate is actor-aware reads, but selection remains owner-controlled.

Acceptance: report names files, shallow interfaces, seams, locality/leverage benefits, before/after diagrams, and a top recommendation; no source files are changed by the review.

Tests/checks: read-only scan, report existence, `git diff --check`.

Skills: `improve-codebase-architecture`, `codebase-design`, `siza-architecture`.

### Stage 1 — Public design and UX track

#### 1.1 Token approval gate

Use the extracted Framer references and 375 px token preview. The owner approved the full token direction on 26 October 2026. Apply the existing token source consistently; do not invent values outside `docs/design-reference/DESIGN_TOKENS.md`.

Acceptance: owner approval is recorded; token preview and 375/768/1440 extraction status are documented; no values outside the approved token source are introduced.

Tests/checks: token/source consistency, 375 px visual check, accessibility contrast review.

Skills: `siza-design-fidelity`, `siza-frontend`, `frontend-a11y`, `verification-loop`.

#### 1.2 Home and public information sections

Build the public home page from `docs/ux/ux-blueprint.md`: hero, host/helper audience switch, host steps, fast picks, truthful trust cues, helper block, FAQ, final calls to action, footer, and legal/contact links. Do not create separate Services or How it works marketing pages; those are home sections in the blueprint. Keep Request and Apply as compatibility hand-offs.

Acceptance: public pages use copy-deck keys, asset-manifest slots, approved hero assets, no invented claims, no forms on the holding page, and no links to unbuilt routes. `/request` and `/apply` resolve through their role-specific signup hand-off; while prototype routes are disabled, signup/login stay reachable as non-collecting holding states, with all mutation APIs still fail-closed.

Tests/checks: copy build, banned-claim scan, 375 px keyboard/accessibility pass, reduced-motion check, speed/LCP check, public browser smoke test.

Skills: `siza-design-fidelity`, `siza-frontend`, `siza-brand-voice-and-copy`, `frontend-a11y`, `ui-ux-pro-max`.

#### 1.3 Public copy, assets, and legal placeholders

Wire the copy deck and asset slots; preserve `{{LEGAL_TEXT_PENDING}}` and owner markers. Add Terms, Privacy, contact details only where supplied by the owner. Do not invent support hours, insurance, cancellation, worker-status, or retention claims.

Acceptance: all public text comes from generated copy; asset references use `SiteImage`/manifest slots; strict copy remains blocked only by documented owner/legal markers.

Tests/checks: `npm run build:copy`, `npm run check:assets`, structure check, copy lint.

Skills: `siza-brand-voice-and-copy`, `siza-legal-guardrails`, `siza-frontend`, `verification-loop`.

### Stage 2 — Foundation and host prerequisite

#### 2.1 Actor-aware read seam

Before expanding host pages, implement the owner-selected actor-aware read module. Move host/helper/admin page reads behind redacted, role-aware view interfaces; pages must not construct service-role queries directly. Test first against the existing booking redaction rules.

Acceptance: host, helper, and admin callers receive only role/state-appropriate fields; unassigned helpers cannot read address or host phone; page modules contain presentation only.

Tests/checks: redaction, wrong-role, wrong-owner, admin-allowed, and RLS integration tests against local Supabase or a separate disposable test project.

Skills: `siza-product-domain`, `siza-security-privacy`, `siza-architecture`, `siza-testing-tdd`, `security-review`, `santa-method`.

#### 2.2 Shared request pipeline

Centralize the repeated route/action pipeline while preserving the required order: prototype switch → rate limit → bot check → input validation → authorisation → server service → database. Keep form redirects and JSON envelopes at the outer route seam.

Acceptance: every API route and server action has the shared prototype guard; ordering and fail-closed behavior are covered once and route-specific behavior stays explicit.

Tests/checks: unauthenticated, wrong-role, wrong-owner, invalid-input, rate-limit, bot-failure, prototype-disabled, idempotency, and JSON/form response tests.

Skills: `siza-api-design`, `api-design`, `siza-security-privacy`, `siza-testing-tdd`, `security-review`, `santa-method`.

#### 2.3 Accounts, host onboarding, and admin MFA

Complete role-fixed signup/login, consent versions, host onboarding, profile edit, and route navigation. Keep account responses non-enumerating and keep admin login separate from public navigation.

Acceptance: role-fixed host/helper signup submits the server-verified bot token and recorded consent; public signup responses do not disclose account existence; public login routes only profile-verified hosts/helpers to their own surface and refuses admins; a host can save and revisit only their own address/onboarding details and reach the host home without bypassing authorization. Admin login stays separate and unlinked; it requires an active persisted admin profile and membership, then Supabase TOTP enrollment/challenge, and every protected page/action/read checks active profile, membership and `aal2`. MFA verification has a separate configured Postgres attempt bucket and atomically reserves a keyed digest to reject TOTP code replay before calling Auth. The lost-authenticator break-glass process and session/security review must be owner-reviewed before the real admin account uses this flow.

Tests/checks: auth/session tests, consent persistence, wrong-role redirects, login rate-limit/lockout behavior, TOTP enrollment/challenge/aal2 guard against local Supabase, host-profile redaction and wrong-owner denial, browser smoke flow.

Skills: `siza-security-privacy`, `siza-frontend`, `siza-api-design`, `siza-testing-tdd`, `security-review`, `santa-method`.

### Stage 3 — Host booking and helper application

#### 3.1 Host request flow

Build host home, service selection, booking form, review state, server-calculated price, idempotency, offer creation, activity history, cancellation/no-show paths, and status views. Use the home sections and app-screen direction in the UX blueprint.

Acceptance: client price/status cannot override server values; duplicate submission returns one booking; host sees only owned requests; request states lead to finding and assignment. Owner decisions (2026-10-26): hosts set their offered hourly amount with a R100/hour floor; starting service suggestions for helper testing are standard R100/hour, deep R160/hour, and Airbnb turnover R155/hour; selected service rates add for the full estimated time, with the primary service setting duration; jobs are at least 3 hours per helper. Keep values and minimum in configuration, store the chosen amount on the booking, and verify the legal wording before enabling prices for real users.

Tests/checks: pricing floor, idempotency, ownership, notices, rate limit, no-show, state-machine tests.

Skills: `siza-product-domain`, `siza-frontend`, `siza-api-design`, `siza-testing-tdd`, `ui-ux-pro-max`.

#### 3.2 Helper application intake

Add helper profile, identity documents, consent, one-reference capture/storage, pending state, private retention records, and rollback-safe upload handling. Add a forward-only migration for reference data; never edit `0001_init.sql`.

Acceptance: application stays pending until admin checks pass; references and documents are admin-only; profile and document metadata insert atomically; retries cannot overwrite an existing application; definite failed writes leave no database rows and trigger compensating deletion of staged objects; an ambiguous RPC outcome preserves potentially referenced images and tells the helper to check before retrying; ID encryption/hash remain intact and the configured retention clock starts at approve/decline. Retryable orphan cleanup and real-user privacy approval remain open.

Tests/checks: schema/RLS matrix, upload type/size/EXIF/rollback tests, duplicate phone/ID tests, retention tests, disposable local/test-project integration tests.

Skills: `siza-database-supabase`, `database-migrations`, `postgres-patterns`, `siza-security-privacy`, `siza-frontend`, `siza-testing-tdd`, `security-review`, `santa-method`.

#### 3.3 Rotation, acceptance, reveal, check-in, completion

Complete helper jobs, fair rotation, atomic first acceptance, address/phone reveal, check-in code, no-show, confirmation lock, auto-complete, reports, and subscription eligibility. The owner also approved one optional soft host gender preference: a helper may self-describe a single private matching category; this affects offer ranking only after workload fairness, never eligibility. No other personal attribute may affect matching. Exclude helpers with another accepted job that overlaps the requested time from offers and admin shortlists; serialize acceptance/assignment so concurrent requests cannot double-book a helper. Keep all Phase B money holding out of scope.

Acceptance: exactly one helper wins a slot; a helper with an overlapping accepted job is absent from offers, helper open-job views, and admin shortlists; simultaneous overlapping claims/assignments cannot both succeed. Reveal rules hold; a valid check-in atomically records attendance and moves the booking to `in_progress`; five wrong attempts cause the configured lock; expiry denies entry; after the lock ends, a new attempt window starts. Only the assigned active helper may use the check-in function; wrong-code retries do not claim success and correct-code retries are safe. A helper confirmation records that helper's side; host confirmation after all active assigned helpers have checked in completes the booking. Completion updates assignment state and first-job subscription eligibility atomically. The separate auto-release function must complete only overdue bookings with every active requested slot assigned and checked in, no host confirmation, and no open/reviewing report; its configured interval must be a positive whole number; Stage 4.4 must schedule it. Later acceptance requires active subscription eligibility. Optional gender preference changes ranking only after fair workload ordering; non-opted helpers remain eligible, helper preferences are private, and only the signed-in helper can change their own preference. No other personal trait affects matching. For a no-show, only that helper's slot reopens, other helpers keep their jobs, and the absent helper gets one strike atomically. After the configured 60-minute recovery window, the host may proceed with fewer helpers or close only the vacant slot. Either choice blocks further claims to that slot; closing the only remaining slot cancels the booking, while other active helpers retain their work. This choice is recorded atomically and safely replayed. The host page exposes both actions. Privacy notice approval remains a gate before real preference collection.

Tests/checks: 20-way slot concurrency, overlapping-request race, offer/read/shortlist exclusion, state transitions, reveal/RLS, check-in expiry/lockout, confirmation ownership/concurrency, multi-helper check-in requirement, atomic assignment/first-job completion, confirmation lock, auto-complete, subscription gate, local Supabase preference/mix/opt-out tests, and Playwright journey.

Skills: `siza-product-domain`, `siza-database-supabase`, `siza-api-design`, `siza-frontend`, `e2e-testing`, `siza-testing-tdd`, `security-review`, `santa-method`.

### Stage 4 — Admin, email, subscription operations, and jobs

#### 4.1 Admin operations

Build the admin overview, helper queue/detail, booking queue/detail, reports resolution, rate-card editor, suburb/transport/config settings, and append-only audit visibility. The overview snapshot is implemented as request-time aggregate counts; it is not online presence or an error dashboard. The read-only `/admin/audit` page is in progress and does not replace the remaining operations screens. TOTP enrollment and `aal2` authorization are implemented; do not call the admin flow complete until the security review, recovery/runbook decision, real owner-account setup, remaining operations screens, and owner UX review pass.

Acceptance: non-admin access is denied on every page/action; config edits are validated/audited; documents use short-lived signed URLs; MFA lockout/session handling passes review.

Tests/checks: admin authorization, audit append-only, config validation, MFA security tests, RLS tests.

Skills: `siza-frontend`, `siza-api-design`, `siza-security-privacy`, `security-review`, `santa-method`, `ui-ux-pro-max`.

#### 4.2 Email sending and domain setup

Generated-copy templates and Resend idempotency keys now cover request received/no-helper, host/helper assignment, helper approval/decline, and admin request/application notifications. The provider retains keys for 24 hours, so durable event/outbox wiring remains required before the full event-once acceptance can pass. Wire those messages to domain events and add check-in/subscription reminders. Keep sender/domain status unclaimed until DNS and provider verification; use Gmail as reply-to only if the owner supplies it.

Acceptance: no email contains private IDs, addresses, or secrets; duplicate events send once; domain/sender configuration is documented and not claimed ready until verified.

Tests/checks: template/copy tests, idempotency tests, provider failure tests, no-PII log tests.

Skills: `siza-api-design`, `siza-brand-voice-and-copy`, `siza-security-privacy`, `siza-testing-tdd`, `security-review`.

#### 4.3 Subscription marking and reminders

Implement manual cleared-payment marking, payment reference, period extension, reminders at configured intervals, grace period, and paywall. This is not card processing or funds holding.

Acceptance: admin can mark only a cleared payment; extension math is correct; reminders are idempotent; lapsed helpers cannot accept later jobs.

Tests/checks: payment-mark authorization, extension math, duplicate reminders, subscription gate integration tests.

Skills: `siza-product-domain`, `siza-api-design`, `siza-security-privacy`, `siza-testing-tdd`, `santa-method`.

#### 4.4 Retention scheduling and operational jobs

The document-retention service and a bearer-authenticated, fail-closed `POST /api/jobs/retention` entry point are implemented. Choose and configure a scheduler only after the owner selects the provider, secret storage, cadence, and runbook owner. Then schedule document deletion, booking expiry, auto-complete, subscription lapse, and reminder jobs through authenticated idempotent jobs. Record operations in `docs/ops-log.md`.

Acceptance: each job is safe to run twice, has an owner/runbook, and does not expose PII in logs.

Tests/checks: fake-clock job tests, replay/idempotency tests, retention integration tests.

Skills: `siza-architecture`, `siza-security-privacy`, `siza-testing-tdd`, `safety-guard`.

### Stage 5 — Hardening, pilot, and Phase B gate

#### 5.1 Security and data verification

Run local Supabase or a separate disposable test project for RLS, migrations, concurrency, uploads, auth, and encryption. The linked project remains read-only unless the owner explicitly authorises a write.

Acceptance: all required RLS and abuse tests pass; no real linked-project records are changed; disposable fixtures are deleted; independent security review is complete.

Skills: `siza-database-supabase`, `siza-security-privacy`, `security-review`, `santa-method`, `safety-guard`, `verification-loop`.

#### 5.2 Backup, restore, deploy, and domain checklist

Complete backup/restore drill, key-backup/rotation note, deploy checklist, domain/email DNS checklist, monitoring, and admin guide. Record actual outcomes, not intentions.

Acceptance: restore is proven on a disposable target; deploy checklist is executable; domain/email/security headers are verified before real users.

Skills: `siza-architecture`, `siza-security-privacy`, `production-audit`, `verification-loop`, `safety-guard`.

#### 5.3 Legal, pilot metrics, and real-user gate

Resolve legal/privacy/terms, worker-status, retention, insurance, company/tax, and support-owner items before real users. During the pilot track requests per week, acceptance time, completion rate, repeat hosts, no-shows, approved helpers, reports, and subscription conversion.

Acceptance: legal owner sign-off is recorded; metrics are defined without analytics trackers; pilot scope is limited to approved suburbs/helpers; owner signs the launch gate.

Skills: `siza-legal-guardrails`, `siza-brand-voice-and-copy`, `production-audit`, `verification-loop`.

#### 5.4 Phase B gate

Do not begin card payments, holding, ledger, payouts, refunds, or reviews until the legal/accounting gate and the pilot evidence meet the owner-approved thresholds in the spec. Record the decision in an ADR.

Acceptance: legal/accounting approval, pilot metrics review, and explicit written owner authorization are all present.

Skills: `siza-payments-ledger`, `siza-legal-guardrails`, `architecture-decision-records`, `security-review`, `santa-method`.

## Required verification gate

Run and record: `npm test`, `npm run typecheck`, `npm run lint`, `npm run check:structure`, `npm run check:assets`, `npm run build:copy`, `npm run knip`, `npm audit --audit-level=high`, and `npm run build`. If a command is blocked by the environment, record the exact blocker in `docs/BUILD_STATUS.md` and `docs/ops-log.md`; never mark the milestone green.

## Current known blockers

- Pricing interpretation is owner-decided: hosts set the hourly amount above a R100/hour floor; the listed rates are starting suggestions, selected rates add for the full primary-service duration, and jobs have a 3-hour minimum per helper. Configuration and legal wording must still be verified before enabling prices for real users.
- Helper reference capture/storage, admin MFA review/recovery and the real owner-account enrollment are Phase A completion blockers.
- Legal/owner copy markers remain unresolved.
- Linked Supabase is read-only unless explicitly authorised for a write.
- Phase B remains gated.
