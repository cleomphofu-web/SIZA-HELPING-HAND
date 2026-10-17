# SIZA v2 realignment audit

**Scope:** repository inventory on 17 October 2026. No database, deployment, or remote migration was touched.

## Evidence

- `npm run check:structure` currently fails only because the legacy migration contains `cleaner` terminology. It must not be edited if applied.
- `npx knip` reports unused legacy exports, `framer-motion`, `geist`, the key-generation script, bootstrap tools, and third-party skill implementation files. Skill/tool files are intentional operational files, not product dead code.
- `npm run build:copy` succeeds with 450 copy keys and reports 19 `[OWNER]`, `[CONFIRM]`, or legal markers.
- `npm run typecheck` cannot run because no `typecheck` script exists; this is a required configuration repair.

## Inventory and disposition

| Item | What it is | Action | Why | Target |
|---|---|---|---|---|
| `app/` | Current Next routes: old public, admin, API | RENAME | v2 assumes `src/app` and helper terminology. | `src/app/` |
| `app/book`, `app/cleaners/apply` | Superseded public routes | DELETE | Explicit delete list and blueprint route map. | Removed |
| `app/api/bookings`, `app/api/cleaners/apply` | Public routes that collect and persist personal data | REUSE | Validators, rate limits, bot checks and rollback are valuable; public prototype must 404 unless enabled. | `src/app/api/...` behind gate |
| `app/api/admin/login`, `app/admin` | Admin authentication and operations | REUSE | Server-side authorisation and private-document work remain needed. | `src/app/admin` behind gate |
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
