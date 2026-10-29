# SIZA API route inventory

This is an inventory and SIZA-specific delta, not a copy of the generic `api-design` skill. The skill remains the detailed reference for REST resource naming, status codes, pagination, and rate-limit headers.

## Rules that apply here

- Current routes are internal Next.js handlers under `/api/*`; do not rename them to `/api/v1` without an ADR.
- Future external or partner-facing APIs use `/api/v1/*`.
- Responses use the existing `Result<T>` shape from `src/server/services/result.ts`.
- Every mutation follows: prototype switch → rate limit → bot check → input validation → authorisation → server service → database.
- Creation mutations accept an idempotency key where the domain requires one.
- Authorization is role plus ownership; database reads/writes stay server-side.
- Error responses never expose SQL, provider errors, stack traces, secrets, or another user’s identifiers.

## Route inventory

| Route | Method | Actor | Purpose | Idempotency / special rule |
|---|---:|---|---|---|
| `/api/auth/signup` | POST | Public | Create a role-fixed account and consent record | Non-enumerating; bot and login bucket |
| `/api/auth/login` | POST | Public | Sign in a host/helper | Non-enumerating; strict login limit |
| `/api/admin/login` | POST | Admin candidate | Admin password sign-in | Non-admins are signed out; routes an active admin to TOTP setup/challenge and only an `aal2` session reaches `/admin` |
| `/api/host/onboarding` | POST | Host | Save host details | Ownership checked |
| `/api/host/account` | POST | Host | Update the authenticated host's first name, surname, and normalized phone | Strict validation; uniqueness conflicts do not reveal another account |
| `/api/helper/onboarding` | POST | Helper | Save helper profile and private documents | Upload validation, rollback, and replay protection remain Stage 3.2 blockers |
| `/api/helper/profile/matching-preference` | POST | Helper | Save or clear the helper's optional, private soft gender ranking preference | Explicit opt-in; only affects ties after workload ranking; no other personal traits are used |
| `/api/bookings` | POST | Host | Create an idempotent priced request | Server calculates price and creates offers |
| `/api/helper/jobs/accept` | POST | Helper | Atomically claim a slot | First accept wins; subscription gate |
| `/api/helper/jobs/check-in` | POST | Helper | Verify check-in code | Five-attempt lock and expiry |
| `/api/host/requests/check-in-code` | POST | Host | Issue the check-in code | Assigned booking only |
| `/api/bookings/confirm` | POST | Host/helper | Confirm completion | Participant only; confirmation lock |
| `/api/bookings/no-show` | POST | Host | Reopen a no-show booking | Configured timing and strike rules |
| `/api/bookings/no-show-resolution` | POST | Host | Proceed with fewer helpers or close only a vacant no-show slot after the configured recovery interval | Same-origin host action; atomic and replay-safe; preserves other assignments |
| `/api/reports` | POST | Host/helper/admin | Create a report | UUID idempotency key; booking participant/role authorization |
| `/api/admin/retention` | POST | Admin | Manually purge expired private documents | Admin session and same-origin check |
| `/api/jobs/retention` | POST | Internal job | Purge expired private documents | Optional `MAINTENANCE_JOB_SECRET` bearer; fail closed when unset; no request body or query |

## Not yet implemented

- External `/api/v1` surface.
- Admin MFA is a server-action flow at `/admin/mfa`, backed by existing Supabase Auth TOTP. It has no separate public JSON endpoint; verification is limited by the separate Postgres `mfa_verify` bucket (five submissions per account per 15 minutes) and rejects code reuse within the configured replay window; account recovery remains an owner-run break-glass process.
- Manual subscription-payment marking and reminder endpoints.
- Rate-card, transport-zone, and app-config admin endpoints.
- Contact form endpoint; public contact remains non-collecting until the product gate allows it.
