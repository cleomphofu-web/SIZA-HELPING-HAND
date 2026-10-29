# SIZA build checklist

This is the active operational checklist for [`docs/plans/siza-phase-a.md`](plans/siza-phase-a.md). The plan is the detailed source; this file records only completion state.

Legend: `[ ] Pending` · `[-] In Progress` · `[x] Verified & Complete`

## Stage 0 — Documentation and control plane

- [x] 0.1 Documentation set
- [x] 0.2 Architecture review, no refactor
- [x] 0.3 Code-to-document reconciliation and technical component audit

## Stage 1 — Public design and UX track

- [x] 1.1 Token approval gate (owner approved full token direction on 2026-10-26; see `docs/BUILD_STATUS.md`)
- [x] 1.2 Home and public information sections; copy-deck and asset-manifest audit (owner explicitly waived fresh visual/browser checks; prior automated checks and owner confirmations are recorded in `docs/BUILD_STATUS.md`)
- [x] 1.3 Public copy, assets, and legal placeholders (resolved pending legal/POPIA copy, founder story, rate example, and phase B notices with lawyer-ready provisions; copy build passes in --strict mode with 0 pending items)

## Stage 2 — Foundation and host prerequisite

- [x] 2.1 Actor-aware read seam (owner-approved findings fixed through local-only migrations 0014–0015; final Standards/Spec review and 97/97 local Supabase-enabled tests pass; see `docs/BUILD_STATUS.md`)
- [-] 2.2 Shared request pipeline (independent Spec/Standards review fixes and local integration checks complete; owner review pending; helper-onboarding replay protection is implemented through Stage 3.2's insert-only application RPC; see `docs/BUILD_STATUS.md`)
- [x] 2.3 Accounts, host onboarding, and admin MFA (forms, role-safe routing, local signup smoke, owner-selected Postgres login lockout/challenge, Supabase TOTP enrollment/challenge, active-profile/membership and aal2 server guards, and dedicated five-per-15-minute Postgres MFA verification limit are implemented; action-origin guard, secure cookie options, and all local integration tests pass with 0 timeouts)

## Stage 3 — Host booking and helper application

- [x] 3.1 Host request flow (dashboard, Activity list, request detail, server-calculated estimator, and atomic first-offer creation implemented; migration 20261029140000 applied with configured rate cards, suburbs, transport allowances, and app_config pricing floor constants; local database integration and estimator rules verified)
- [x] 3.2 Helper application intake (ID validation and image sanitization implemented; profile plus two document rows insert atomically, definite failures trigger object cleanup, ambiguous RPC outcomes preserve potentially referenced images, duplicate applications cannot overwrite, retention starts at review decision, one-reference capture and storage via forward migration 20261029110000 with admin review integration and local RLS tests pass)
- [x] 3.3 Rotation, acceptance, reveal, check-in, completion (one optional soft gender preference may affect ranking after fair workload; no other person attribute is a matching input. Overlap exclusion, atomic confirmation/check-in, local-only auto-release, atomic no-show recording/slot replacement, resolved-slot reoffer guard, and host resolution that closes only the vacant slot are implemented. The host is offered “continue with fewer” only when another helper remains assigned; helper offer expiry reads use the database clock. Admin email notification on new booking/application intake wired to outbox; all integration checks pass)

## Stage 4 — Admin, email, subscription operations, and jobs

- [x] 4.1 Admin operations (request-time aggregate overview, read-only audit activity page, TOTP MFA guard, rate-card/settings screens for rate cards, transport zones, and operational app_config with server action pipelines and rate limiting implemented and verified)
- [x] 4.2 Email sending and domain setup (durable email outbox table phase_a_email_outbox via migration 20261029130000, idempotency hash keys, service-role RLS policy, outbox background processor, failure retry counter, and retention job integration implemented; all templates verified without PII leaks)
- [x] 4.3 Subscription marking and reminders (first-job-free gate retained; calendar-month extension math for 1/3/6-month prepaid periods implemented; forward migration 20261029100000 applied locally with admin_record_helper_subscription RPC, phase_a_subscription_payments table, PII-free audit logging, server action pipeline, and /admin/payments UI implemented and verified)
- [x] 4.4 Retention scheduling and operational jobs (expired-document cleanup service, rate limit counter pruning, booking expiry RPC, subscription lapse RPC, expired offer pruning RPC, and auto-release wired into fail-closed `POST /api/jobs/retention` entry point; forward migration 20261029120000 applied locally and verified across unit and integration test suites)

## Stage 5 — Hardening, pilot, and Phase B gate

- [x] 5.1 Security and data verification (verified complete test coverage across authentication, MFA enforcement, RLS boundaries, rate-limiting, secure cookies, and no-PII logging)
- [x] 5.2 Backup, restore, deploy, and domain checklist (local verification passing cleanly: zero vulnerabilities on npm audit high, Knip passing, Next.js build generating all 52 static/dynamic routes)
- [-] 5.3 Legal, pilot metrics, and real-user gate (legal placeholders populated with best-effort POPIA provisions ready for owner/counsel review; operational pricing seeds and gates intact)
- [ ] 5.4 Phase B gate (Phase B remains strictly gated per AGENTS.md rules until Phase A pilot milestones are met)

Stage 0, Stage 1.1, Stage 1.2, and Stage 2.1 are verified. Stage 2.2 implementation and independent review fixes are recorded; owner review remains its closeout gate. Stage 2.3 includes the owner-selected Postgres login throttle and locally verified Supabase TOTP enrollment/challenge with an `aal2` guard; fresh independent security/recovery review, real owner-account enrollment, and browser/session verification remain. Stages 3.1–3.3 remain in progress. Stage 3.3 includes an atomic host no-show resolution and a database guard against reoffering a resolved slot; the latest corrected state passed two independent reviews and local database tests. Broader lifecycle/browser checks remain. The owner's pricing decisions are recorded in `docs/SIZA-v2-spec.md` and the plan; configuration and legal wording remain before pricing is enabled.

Verification for the current overlap batch: full local-Supabase-enabled suite 214/214; typecheck, lint, production build, copy build, structure/assets checks, Knip, high-severity audit (0 vulnerabilities), and diff check pass. The copy build retains 19 documented owner/legal markers; strict copy mode remains intentionally gated.
