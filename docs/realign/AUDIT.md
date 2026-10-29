# SIZA v2 realignment audit

**Scope:** repository inventory on 17 October 2026. No database, deployment, or remote migration was touched.

## Evidence

- `npm run check:structure` now ignores only immutable applied migration history and the one forward migration that must name legacy objects while renaming them. New ordinary migrations remain scanned for helper terminology.
- `npx knip` reports unused legacy exports, `framer-motion`, `geist`, the key-generation script, bootstrap tools, and third-party skill implementation files. Skill/tool files are intentional operational files, not product dead code.
- `npm run build:copy` succeeds with 450 copy keys and reports 19 `[OWNER]`, `[CONFIRM]`, or legal markers.
- `npm run typecheck` is configured as `tsc --noEmit`.

## Starting verification — 17 October 2026

- `npm test`: passed — 5 files, 19 tests.
- `npm run lint`: passed.
- `npm run build`: source compilation and type checking completed, but this run ended with a Windows `EPERM` while creating `.next/static/chunks/next/dist/client`. This is an intermittent generated-build-directory lock; it requires a retry before a clean build result is claimed.
- Build retry after deleting only generated `.next` output: passed. The current host falls back to WebAssembly because its optional native Next SWC binary is invalid; this is a local host warning, not a source failure.
- `git ls-files --error-unmatch .env`: confirmed `.env` is not tracked.
- `npm run knip` now scopes product analysis to `src/` and tests, while treating the operational scripts as entry points. With `NODE_OPTIONS=--max-old-space-size=4096`, it reports no unused product code or dependencies. Its remaining configuration hints identify the owner-requested ignored operational/documentation paths.
- The unused `framer-motion` and `geist` dependencies were removed. `tailwindcss` is retained because the active stylesheet imports it.

### Environment variable names

Historical 17 October inventory: `ALLOW_PROTOTYPE_ROUTES`, `NEXT_PUBLIC_APP_MODE`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ID_ENCRYPTION_KEY`, `WHATSAPP_GROUP_LINK`, `ADMIN_NOTIFY_EMAIL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_HERO_VIDEO_ID`.

Current names on 26 October: `ALLOW_PROTOTYPE_ROUTES`, `NEXT_PUBLIC_APP_MODE`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ID_ENCRYPTION_KEY`, `WHATSAPP_GROUP_LINK`, `ADMIN_NOTIFY_EMAIL`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_HERO_VIDEO_ID`, `MAINTENANCE_JOB_SECRET`, `NODE_ENV`, `LOCAL_SUPABASE_URL`, `LOCAL_SUPABASE_ANON_KEY`, `LOCAL_SUPABASE_SERVICE_ROLE_KEY`, `RUN_LOCAL_SUPABASE_RLS_TESTS`. Runtime rate limiting uses PostgreSQL; Upstash variables are no longer used.

## Public hero batch — 17 October 2026

- The owner approved the home layered-hero treatment and the reusable public-page hero direction. The supplied hero and carved-wood assets now power the public marketing routes only; no form, database, or remote service was added.
- `npm run build:copy`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run check:assets`, and `npm run check:structure` passed after the change.
- Local browser verification at 375px could not run in this session: the host denied the local development-server socket and the sandbox has no Playwright browser installed. The implementation has responsive CSS and an accessible mobile menu, but still needs an owner-visible browser review before the visual work is called final.

## Phase A batch — 18 October 2026

- `npm test`: passed — 7 files, 36 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build:copy`: passed — 532 keys; the existing 19 owner/legal markers remain and strict mode is intentionally not green until owner/lawyer text is supplied.
- `npm run check:structure`: passed — 97 files scanned.
- `npm run check:assets`: passed.
- `npm run build`: passed using an isolated generated output directory; Next compiled successfully, typechecked, generated 38 routes and finalized traces. The default `.next` directory still intermittently returns Windows `EPERM` while creating nested output directories, so the source build result is recorded separately from that generated-directory lock.
- `npm run knip`: blocked by the host's `oxc-parser` `RangeError: Array buffer allocation failed`, even with a 4096 MB Node heap. No Knip result is claimed.
- `npm audit --audit-level=high`: blocked because the host cannot resolve `registry.npmjs.org` (`ENOTFOUND`). No clean audit result is claimed.
- `supabase status` / local migration lint: blocked because the local Supabase CLI rejects the existing untracked `.env` format before it can start; no remote database was contacted and no migration was executed. `.env` remains untracked.

### Phase A completion pass — 18 October 2026

- `npm test`: passed — 7 files, 36 tests.
- `npm run typecheck`: passed (`tsc --noEmit`).
- `npm run lint`: passed.
- `npm run build:copy`: passed — 534 generated keys; the same 19 owner/legal markers remain intentionally unresolved.
- `npm run check:structure`: passed — 103 files scanned.
- `npm run check:assets`: passed.
- `git diff --check`: passed; output contains only Git's CRLF normalization warnings.
- `git ls-files --error-unmatch .env`: confirmed `.env` is not tracked. Environment names are listed above; no values are recorded here.
- `npm run build`: the default `.next` output again failed with Windows `EPERM` while creating a nested route directory. A follow-up isolated-output build was started, but the local Next/Webpack worker stopped without a completion result; therefore no new clean production-build claim is made for this final pass. The earlier isolated build had compiled 38 routes successfully before the last host-page-only reveal refinement.
- `npm run knip`: remains blocked by the host `oxc-parser` `RangeError: Array buffer allocation failed`.
- `npm audit --audit-level=high`: remains blocked because `registry.npmjs.org` cannot be resolved (`ENOTFOUND`).
- Supabase migration execution remains intentionally pending: `0001_init.sql` was not modified, `0003_phase_a_core.sql` is forward-only, and the local CLI is blocked by the existing untracked `.env` format/local service state.
- In this managed worktree, `node_modules` was absent. `npm ci` began but could not complete because the restricted npm cache has no locked package entry for `zod-validation-error`; therefore `npm test`, `npm run typecheck`, and `npm run lint` could not execute here. Structure, asset, and copy checks still passed.
- Follow-up after dependency restoration: `npm test` passed — 7 files, 36 tests; `npm run typecheck` passed; `npm run check:structure`, `npm run check:assets`, `npm run build:copy`, and `git diff --check` passed. `npm audit --audit-level=high` remains blocked by DNS (`registry.npmjs.org`); ESLint started but did not return a completed result in the managed shell.
- Docker Desktop is reachable with elevated access, but `supabase start` stalled while pulling the local Postgres image. It was stopped before any migration ran; no database schema or data was changed. `0001_init.sql` remains untouched and `0003_phase_a_core.sql` remains unapplied.
- Linked project real-data pass: project `SIZA-HELPING-HAND` was already at migrations `0001`–`0003`; `supabase db lint --linked` found an enum-cast error in `claim_phase_a_slot` and a PL/pgSQL shadowing warning. Forward-only migrations `0004_phase_a_function_fixes.sql`, `0005_phase_a_rpc_privileges.sql`, and `0006_revoke_unused_rls_helper.sql` were applied. Linked schema lint now passes, performance advisors report no issues, and migration history is `0001`–`0006`.
- Linked metadata checks confirmed all 13 Phase A tables have RLS enabled and policies; Phase A RPCs are executable by `service_role` only, not `anon` or `authenticated`. `is_admin()` remains callable by `authenticated` because existing RLS policies require it. Aggregate counts showed zero profiles, helpers, bookings, or reports, so no real user records were read or changed during this pass.
- Final application verification: `npm test` passed — 7 files, 36 tests; `npm run typecheck` passed; `npm run lint` passed; structure/assets/diff checks passed. `npm run build` and isolated-output retry remain blocked by Windows `EPERM` while Next creates nested generated route directories. `npm audit` remains blocked by npm registry DNS.
- Final retry: Docker has a healthy Supabase stack for a different project name, while this worktree has no `supabase/config.toml`; `supabase status` therefore cannot target this repository safely. No migration was applied. The concurrent `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` retry did not return a completed result from the managed shell; the earlier recorded Phase A test/typecheck/build results remain the authoritative source results.

## Inventory and disposition

## App-flow milestone audit (18 October 2026)

- `npm run typecheck`: passed after browser-flow fixes.
- `npm run lint`: passed.
- `npm test`: passed — 7 files, 36 tests.
- `npm run check:structure`: passed.
- `npm run check:assets`: passed.
- `npm run build:copy`: passed with the existing owner/legal markers.
- Host and helper browser forms now redirect back into their journey after onboarding, request creation, acceptance, check-in, and confirmation instead of leaving the user on a raw JSON response.
- Host onboarding now accepts the URL-encoded browser form it renders.
- Host request and helper job detail views now expose the Phase A completion confirmation action after check-in.
- Remaining spec gaps are explicit: admin MFA is not implemented, and helper reference capture/storage is not represented in the current Phase A schema. These are not being claimed complete.
- Stage follow-up: added the missing documented `/terms` placeholder and `/helper/report` screen, with the latter linked from an assigned helper job.

| Item | What it is | Action | Why | Target |
|---|---|---|---|---|
| `app/` | Current Next routes: old public, admin, API | RENAME | v2 assumes `src/app` and helper terminology. | `src/app/` |
| `app/book`, `app/cleaners/apply` | Superseded public routes | DELETE | Explicit delete list and blueprint route map. | Removed |
| `app/api/bookings`, `app/api/cleaners/apply` | Public routes that collect and persist personal data | REUSE | Validators, rate limits, bot checks and rollback are valuable; public prototype must 404 unless enabled. | `src/app/api/...` behind gate |
| `app/api/admin/login`, `app/admin` | Admin authentication and operations | REUSE with security review: do not extend | Server-side authorisation and private-document work remain needed, but lockout, session handling and two-step login need a security review before use. | `src/app/(admin)/admin` behind gate |
| `components/SizaHeader`, `AdminShell` | Shared legacy UI | MERGE | One future public nav and a separate admin shell; wording and links are obsolete. | `src/components/` |
| `lib/auth`, `crypto`, `uploads`, `schemas`, `ratelimit`, `turnstile`, `email`, Supabase clients | Backend and security utilities | REUSE | Preserve validation, crypto, uploads, rate limiting, bot checks, environment handling and Supabase access. | `src/server/` and `src/lib/` |
| `lib/booking-utils` | Job-summary and urgency utility | RENAME | Valuable logic uses cleaner terminology. | `src/lib/booking-utils.ts` |
| `supabase/migrations/0001_init.sql` | Legacy schema and RLS | REUSE | Existing migration cannot be edited once applied; required schema differences need a later migration. | Keep; later forward migration |
| `tests/` | Unit security and utility coverage | RENAME | Preserve and update tests for helper names/prototype behaviour. | `tests/` |
| `scripts/generate-encryption-key.mjs` | Local secret-key helper | REUSE | Supports safe ID encryption configuration. | `scripts/` |
| `DESIGN_BRIEF.md`, `DESIGN_DIRECTIONS.md`, `LANDING_PAGE_CONTENT.md`, `SECURITY_REVIEW.md` | Old root documents | DELETE | Superseded documents; archive after this audit. | `docs/archive/` |
| `README.md` | Old setup/deploy instructions | RENAME | It tells owners to use real Supabase and services, contrary to prototype safety. | Root `README.md` |
| `public/assets/` | Approved asset locations | KEEP | Protected asset manifest location. | `public/assets/` |
| `docs/design-reference/` | Reference area | KEEP | Protected reference material; tokens missing. | `docs/design-reference/` |
| `framer-motion`, `geist` | Unused dependencies | DELETE | Knip evidence; not needed by surviving code. | `package.json` |
| `resend`, `@supabase/*`, `zod` | Backend dependencies | REUSE | Match retained server/security work. | `package.json` |
| Prototype public copy and metadata | Inline legacy strings | DELETE | Copy deck is the only source; old claims/routes violate v2. | Rebuilt later from copy deck |
| `proxy.ts`, Next/Vitest/ESLint/TS configs | Application configuration | RENAME | Move proxy and update aliases/includes for `src/`; preserve security headers. | Root configs plus `src/proxy.ts` |

## Required cleanup batches after owner decisions

1. Archive superseded docs and replace the root README.
2. Delete obsolete routes, legacy public UI and unused dependencies.
3. Move to `src/`; add the prototype gate, update imports/configuration and write architecture/ADRs.
4. Rename reusable identifiers and routes to helper terminology without changing legacy applied SQL.
5. Merge duplicate presentation and validation code, then wire copy/tokens/assets only after design prerequisites are met.

## Owner decisions and Postgres login limiter — 26 October 2026

- Owner approved the full design-token direction; `docs/design-reference/DESIGN_TOKENS.md` records the approval. Host/helper/admin surfaces may use those tokens.
- Owner-selected login policy is recorded in ADR 010 and implemented with forward-only migration `20261026103000_postgres_rate_limits.sql`, applied to loopback local Supabase only. `.env` is not tracked; `.env` and `0001_init.sql` were not changed.
- Owner-supplied copy now includes initial recruitment suburbs and the three-helper opening threshold, cancellation terms, application review target, contact hours and no-insurance statement. Unconfirmed language lines were removed. Privacy/terms/retention legal placeholders and the founder story remain gated.
- `npm run design:extract` evidence includes token captures at 375 px, 768 px, and 1440 px in `docs/design-reference/extract/`; no new extraction was needed for this batch.
- `npm run build:copy`: passed, 669 keys and 8 remaining owner/legal items. Focused limiter/auth/retention unit and route tests passed 27/27; local limiter integration passed 4/4; typecheck and lint passed. Full-suite results are recorded in `docs/BUILD_STATUS.md`.
