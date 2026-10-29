# Antigravity Handoff — SIZA Phase A

**Prepared:** 28 October 2026 (Africa/Johannesburg)  
**Workspace:** `C:\Users\CC BRAKPAN\.codex\worktrees\a280\SIZA`  
**Purpose:** Transfer the product scope, owner decisions, build order, current implementation state, verification rules, and immediate next actions so another agent can continue without reconstructing the chat.

## Read this first

1. Read the root `AGENTS.md` and follow its skill router and hard rules.
2. Read `docs/BUILD_STATUS.md` for the current ledger, then `docs/BUILD_TODO.md` and `docs/plans/siza-phase-a.md` for milestone order and acceptance checks.
3. Read `docs/SIZA-v2-spec.md` for product behavior, `docs/architecture.md` for routes and structure, and the relevant ADR before changing code.
4. Use `docs/ops-log.md` for risky-operation history and `docs/realign/SKILL_USE.md` for skill/file provenance. Update these when appropriate.
5. Check `git status` before touching files. The workspace has a large, intentionally uncommitted implementation and many untracked files. Do not reset, clean, overwrite, or assume a clean baseline. Preserve the already-applied migration `supabase/migrations/0001_init.sql`; all schema changes are forward-only migrations.

The source-of-truth order is in `AGENTS.md`. If this handoff conflicts with it, the higher-ranked source wins. This handoff is an index and transfer note, not a replacement spec.

## Product objective and boundaries

Build **Phase A**: a two-sided SIZA marketplace for hosts and approved helpers in Johannesburg and surrounding pilot areas. Hosts request help; eligible helpers receive offers in fair workload order; the first helper to accept a slot wins atomically; permitted contact/address details become visible only after assignment; the job is checked in and confirmed; reports and helper-subscription eligibility are handled by admins/services.

- Use the product term **helper** in code, schema, and new copy. Older documents may say cleaner; interpret that as helper unless the spec explicitly distinguishes it.
- SIZA does **not** hold host funds in Phase A. Do not implement Phase B card payments, escrow/holding, ledger, payouts, refunds, or reviews until the spec's legal/accounting gate is cleared and the owner explicitly authorizes the work.
- The helper subscription is paid **to SIZA after the helper's first completed job**. The first completed job is free. Phase A subscription operations are manual cleared-payment marking and eligibility; they are not card processing or funds held by SIZA.
- There are no AI features. Do not add trackers, maps APIs, SMS, chat, or new external services without an owner decision and ADR.
- Linked Supabase is read-only unless the owner gives explicit write authorization. Local Supabase or a separate disposable project is the permitted integration-test target. Disposable identities/data must be removed after tests.
- Never edit the already-applied `0001_init.sql`. Add a new forward-only migration for schema changes.

## Owner decisions already made

Treat these as decisions, not open questions. Their canonical recording is in the spec/ADRs/plan; update those documents if implementation reveals a conflict.

### Product, matching, booking

- Hosts choose their offered hourly amount, with a minimum of **R100 per hour**. Starting suggested hourly amounts for testing are standard clean R100, deep clean R160, and Airbnb turnover R155. Keep amounts/configuration in database configuration/rate-card data, not scattered constants. Legal wording and configuration must be verified before real-user pricing.
- For multiple selected services, the **primary service determines estimated duration**; selected service rates are added for that full duration. Minimum is **3 hours per helper**. Recalculate price and status on the server; persist the price on the booking.
- One optional, soft gender preference is allowed only as a matching preference after workload fairness. It must not affect eligibility, and no other personal attribute may affect matching. Preference is private and collection remains gated by privacy/consent review; current matching gate was deliberately forced closed by a local-only migration until cleared.
- For multi-helper no-show: only the absent helper's slot reopens; other helpers keep their assignments; the absent helper receives one strike atomically. After 60 minutes, the host may continue with fewer helpers or close the vacant slot. Closing a vacant slot must not cancel other assigned helpers. Either resolution blocks further claims to that slot. The owner clarified “cancel free” means closing the vacant slot only.
- Host “approval” means confirming an already-assigned helper, not choosing among unassigned applicants.
- Check-in code is for both sides' job flow; preserve the spec's six-digit, hashed, attempt-limited, expiring behavior and role/ownership checks.

### Login and admin security

- Login throttling is PostgreSQL-backed: five failures per account/IP pair in 15 minutes lock that pair; 20 failures per account in one hour trigger a Turnstile challenge rather than an account-wide lock. Do not store raw account/IP values in limiter keys.
- Admin uses Supabase TOTP MFA, active admin profile plus membership, and `aal2` for every protected admin page/action/read. Admin login remains explicit at `/admin/login`, unlinked from public navigation.
- MFA attempts have a dedicated PostgreSQL limit of five per 15 minutes and TOTP replay is prevented with an atomic keyed digest reservation. Never store/log raw OTPs or MFA secrets.
- Lost-authenticator recovery is an owner-run break-glass path for now; do not invent an app reset flow.
- The owner supplied official dummy Turnstile keys for development only. Keep them isolated from production and never expose secrets in logs or client bundles.

### Copy and legal decisions

- Owner supplied recruitment pilot areas: Sandton, Rosebank, Bryanston, Vanderbijlpark, and Vereeniging; a suburb opens only when three helpers there are approved. Recruitment and staffing must be coordinated. Do not imply every area is open merely because it appears in the recruitment list.
- Application review target: within 5 working days.
- Contact hours: Mon–Sat, 07:00–18:00; aim to reply within 4 hours.
- State that SIZA does not replace the user's home/business cover and does not currently provide insurance, subject to legal review.
- Cancellation terms are owner-supplied in the copy deck/spec; retain owner/legal markers and do not improvise legal interpretation.
- Earnings example is pending the final configured rate card. Privacy, terms, retention and other legal copy must remain marked pending until reviewed. For legal questions the owner said to choose a cautious draft a lawyer could review, not to claim that it is legally approved.
- Siza/Thusa/Xhosa lines require native-speaker confirmation; remove an unverified line rather than invent a translation.
- Founder name/story and “last updated” attribution: IKAMVA AUTOMATIONS, subject to the copy deck's exact placement/marker.

### Design and screen direction

- The owner approved the design tokens on 26 October 2026. Apply broadly according to the UX blueprint, while preserving the Framer public-page direction and existing token source.
- Owner wants screen-by-screen UX review. For a visual draft that conflicts with the main build/spec, explain the conflict and keep it out of real routes until approved.
- Requested screen inventory is captured by the spec, plan and existing route map. Host surfaces include signup/login, onboarding/profile, request home, activities/history, request detail, assigned-helper view/confirmation, job completion/check-in, account/profile edit/report/legal/privacy/sign-out, with optional profile image. Helper surfaces include application/onboarding, login, jobs/home, assigned job/check-in/completion, activities, public/review profile, subscription/payments status, account/report/legal/privacy/cookies/billing/sign-out. Admin surfaces include login/MFA, overview, helper review, host/helper reports, booking operations, rate card/settings, and useful error context. Do not build a new route before reconciling it with the route map/spec.
- Helper profile shown to a host may include a required profile image, bio, total jobs and permitted aggregate experience/feedback metrics only if backed by the spec/data and privacy review. Do not invent “complaints” or satisfaction metrics without a defined, fair, privacy-reviewed source.
- Design component links from Untitled UI, Aceternity, shadcn, and Magic UI are inspiration, not a requirement to install packages. Prefer existing project components and accessible native controls; justify any exact-pinned new dependency.

## Decision rationale and evidence (shareable reasoning summary)

This is a concise decision record, not private internal chain-of-thought.

- **Build in gated stages:** the app handles identity documents, home access/contact data, worker status, and payments. A stage plan with explicit tests/reviews reduces the chance of building UX ahead of security or legal constraints. Evidence: `docs/plans/siza-phase-a.md`, ADRs, and the spec.
- **Keep database access server-only and actor-aware:** hosts, helpers, and admins must see different fields, especially before assignment. Redacted view modules and ownership checks put the rule at a trusted boundary instead of relying on the UI. Evidence: Stage 2.1 in the plan and `src/server/views/` / policy tests.
- **Use database atomicity for races:** booking creation, offer acceptance, assignment, check-in/completion, no-show slot replacement, and one-time MFA replay protection can race across requests. Database constraints/RPCs and local concurrent tests are used where application-only checks would be unsafe. Evidence: ADRs 005, 006, 008–012 and forward migrations.
- **Keep Phase A money simple:** helper subscription eligibility follows a free first completed job and manual cleared-payment records; SIZA does not take or hold host funds. This preserves the spec boundary and avoids starting the separate legal/accounting Phase B gate.
- **Fail closed on prototype/auth boundaries:** prototype mutations must remain centrally disabled when configured off; auth and privileged server actions validate origin, active actor/membership and required assurance level. Session cookies have HttpOnly, SameSite Lax, Secure in production and one-hour lifetime.
- **Use local Supabase for integration proof:** production-linked data is not a test fixture. Current migration/testing history uses loopback Supabase only; preserve that separation.
- **Keep uncertain claims pending:** owner/legal markers stay visible until verified. Never turn a draft decision into a claim of legal compliance, insurance, vetting, or launch readiness.

## Required build order and handoff state

The detailed checklist is `docs/BUILD_TODO.md`; the plan defines acceptance/tests/skills for every milestone. The following is a high-level transfer map. A partial implementation is not a completed milestone.

| Order | Milestone | Recorded state at handoff | Remaining closeout |
|---|---|---|---|
| 0 | Documentation/control plane and architecture review | Verified complete | None, unless docs drift is found |
| 1.1 | Token approval gate | Verified complete; owner approved | No broadened token redesign needed |
| 1.2 | Public home and information sections | Marked complete; owner waived another visual check | Preserve hand-off behavior and current route map |
| 1.3 | Public copy/assets/legal placeholders | Pending | Keep copy deck and manifest as sources; resolve only authorized copy/legal items |
| 2.1 | Actor-aware read seam | Verified complete | Keep redaction/RLS coverage current |
| 2.2 | Shared request pipeline | Implementation/review fixes recorded; owner review was the ledger closeout gate | Verify current files/tests and update the ledger; owner has repeatedly instructed continued progress, so do not stop at the old chat gate unless a new explicit decision is required |
| 2.3 | Accounts, host onboarding, admin MFA | In progress | Final independent security review of latest Origin/cookie changes, full verification, real owner-account setup and browser/session check; do not use real admin account until owner-run recovery/session checklist is ready |
| 3.1 | Host request flow | In progress; dashboard/activity/detail/estimator/atomic offer creation exist | Complete configured areas/rates/size bands, legal wording gate, browser/accessibility/security review and remaining lifecycle paths |
| 3.2 | Helper application intake | In progress; ID validation, image sanitization, atomic profile/doc inserts, duplicate/ambiguous-failure handling and decision-relative retention exist | One-reference capture/storage, retryable orphan cleanup, privacy review and remaining admin-facing lifecycle |
| 3.3 | Rotation, acceptance, reveal, check-in, completion | In progress; overlap guards, fair ordering, atomic check-in/completion/no-show and vacant-slot resolution substantially implemented; latest earlier review passed | Rerun broad lifecycle/browser checks after current security batch; notification, consent/privacy review, scheduling, and full end-to-end journey remain |
| 4.1 | Admin operations | Partial: aggregate overview, audit page, MFA, some helper/booking/report surfaces | Finish queues/actions, rate card/settings, useful safe error handling, account/recovery and owner UX review |
| 4.2 | Email/domain | Partial: templates and some provider/idempotency work | Durable event/outbox, check-in/subscription reminders, DNS/domain/sender verification and failure tests |
| 4.3 | Subscription operations | Partial: first-job-free gate and calendar-month extension math | Owner-configured fee/periods, atomic cleared-payment recording/reference, reminders, grace/paywall job and admin UI |
| 4.4 | Retention and operational jobs | Partial: document retention service and fail-closed retention job endpoint | Choose scheduler, secrets/runbook owner/cadence; orphan cleanup, booking expiry, auto-complete, subscription lapse and reminders |
| 5.1 | Security and data verification | Pending | Full RLS, abuse, auth, upload, encryption, concurrency, local migration and independent review matrix |
| 5.2 | Backup, restore, deploy/domain | Pending | Prove restore on disposable target; document deploy, key backup/rotation, domain/email/monitoring/admin runbooks |
| 5.3 | Legal, pilot metrics, real-user gate | Pending | Legal/privacy/worker-status/retention/insurance/company/tax/support decisions; define pilot scope/metrics and record owner signoff |
| 5.4 | Phase B gate | Pending and explicitly blocked | No Phase B work without legal/accounting clearance, pilot evidence, ADR and explicit written owner authorization |

**Important state reconciliation:** the last complete local Supabase suite recorded in `docs/BUILD_STATUS.md` is 388/388 before the latest Server Action Origin/cookie hardening. The latest full run after those edits completed with 360 passed, 32 skipped, and one suite failed because `tests/integration/booking-rls.local.test.ts` hit a 30-second `beforeAll` timeout under parallel local Supabase load (65 other test files passed). Typecheck, lint and production build passed for that latest batch; structure/assets/Knip/audit/database-lint results were also recorded as passing in the latest working context before the final wrapper adjustments. Do not report the latest full test run as green. Rerun the focused security tests and local RLS suite with suitable isolation/timeout; update `BUILD_STATUS.md` and `ops-log.md` with actual new outcomes.

## Immediate next actions

1. **Reconcile current code and ledger before implementation.** Inspect `git status`, `git diff --stat`, and the latest code for `src/server/policies/request-pipeline.ts`, `src/server/security/origin.ts`, `src/lib/supabase-cookie-options.ts`, `src/proxy.ts`, `src/server/db/server.ts`, and the three admin Server Action modules. Preserve all existing user work.
2. **Finish Stage 2.3 security closeout.** Run focused tests for origin checks, shared action pipeline, MFA, helper/admin booking actions, cookie options, Proxy, and server Supabase client. Resolve real failures only. Obtain fresh independent Santa-method reviews for the final auth changes. Do not reuse a reviewer result from before the latest changes.
3. **Rerun the local Supabase integration coverage.** Confirm URL is loopback before test use; never print local credentials or touch the linked project. The last full run's booking RLS setup timeout is a failure to investigate, not a pass. Ensure disposable identities/data are removed.
4. **Run the required complete gate** from `AGENTS.md` and the plan: `npm test`, `npm run typecheck`, `npm run lint`, `npm run check:structure`, `npm run check:assets`, `npm run build:copy`, `npm run knip`, `npm audit --audit-level=high`, `npm run build`, plus applicable local `supabase db lint --local` and `git diff --check`. Report skipped tests and pre-existing warnings explicitly.
5. **Update truth in the docs**: `docs/BUILD_STATUS.md`, `docs/BUILD_TODO.md`, `docs/ops-log.md`, `docs/realign/SKILL_USE.md`, and relevant ADR/plan entries. Do not mark Stage 2.3 complete until acceptance items, independent review, owner-account setup requirements and session/browser checks are actually closed.
6. Continue in the plan's numeric order through Stage 3, then Stage 4, then Stage 5. Keep the owner in the loop at milestone gates; user has explicitly asked to keep building when prior owner-review gates were mentioned. Ask only when scope changes or a decision is truly blocking.

## Verification and security rules for the next agent

- Tests are written first for behavior changes. Cover authorization, ownership, invalid input, idempotency, concurrency and denial paths, not only happy paths.
- Use local Supabase or a separate disposable test project for RLS/migration integration. Check loopback before setting integration-test variables. Never echo tokens/keys. Never write to linked Supabase without new explicit permission.
- Never delete or alter migrations already applied. In particular, do not edit `0001_init.sql`; add a new timestamped/numbered forward migration.
- Every API route and Server Action starts with the central prototype guard and shared pipeline. Required order is: **prototype switch → rate limit → bot check → input validation → authorization → server service → database**. Preserve any strict Origin/Host checks and cookie protections already added.
- Database reads/writes stay in `src/server/**`; role and ownership checks happen server-side. Do not expose raw ID numbers, addresses, phone numbers, tokens, OTPs, upload paths, or internal errors in logs/client bundles.
- Business values belong in database configuration/rate-card/transport-zone data, not scattered constants. Money is integer cents; timestamps UTC; display in Africa/Johannesburg.
- Keep generated copy generated from `docs/copy-deck.md`; images via `docs/ASSET_MANIFEST.md` and `SiteImage`; design tokens in `docs/design-reference/DESIGN_TOKENS.md` / generated CSS. Do not edit generated files by hand.
- Read the installed Next.js guide under `node_modules/next/dist/docs/` relevant to each code change. This repository uses a breaking Next version; do not rely on remembered conventions.
- Use the applicable skills listed in `AGENTS.md`; for auth, uploads, RLS, encryption or money, run `security-review` and the required independent `santa-method` review before closing the milestone. Record skill use and changed files.
- Keep owner/legal markers pending until verified. Do not claim launch readiness based only on compilation or unit tests.

## Known owner actions and launch dependencies

These cannot be completed by an agent without the owner's own account, legal authority or external setup:

- Enroll the real admin account in MFA in a controlled browser session after reviewing recovery and session procedures.
- Supply any final provider/domain/DNS decisions and credentials through the approved secure setup, not chat or source files.
- Approve lawyer/accountant/Information Officer decisions for legal/privacy, worker status, retention, insurance, company/tax, and subscription terms before real users.
- Decide scheduler provider, cadence, secret storage and runbook owner before enabling recurring operational jobs.
- Review the completed screen-by-screen UX before real product rollout.
- Explicitly clear the Phase B legal/accounting and pilot gate before any Phase B implementation.

## Files to treat as canonical

- Product rules and flows: `docs/SIZA-v2-spec.md`
- Build order/checklist/state: `docs/plans/siza-phase-a.md`, `docs/BUILD_TODO.md`, `docs/BUILD_STATUS.md`
- Architecture/routes: `docs/architecture.md`; route inventory: `docs/api-design.md`
- UX: `docs/ux/ux-blueprint.md`; approved token source: `docs/design-reference/DESIGN_TOKENS.md`
- Copy/visual assets: `docs/copy-deck.md`, `src/content/copy.generated.ts` (generated), `docs/ASSET_MANIFEST.md`
- Decisions: `docs/adr/`
- Risky operations: `docs/ops-log.md`
- Skill provenance: `docs/realign/SKILL_USE.md`
- Architecture and implementation findings: `docs/phase-a-implementation.md`, `docs/technical-component-matrix.md`

## Handoff note

This document was prepared from the build ledger, plan, product/architecture/security skills, the documented owner decisions, and the latest available verification output. It contains a rationale/evidence summary so another agent can make decisions consistently; it does not attempt to reproduce private internal chain-of-thought. **Implementation is paused at the owner's request after this handoff is written.**
