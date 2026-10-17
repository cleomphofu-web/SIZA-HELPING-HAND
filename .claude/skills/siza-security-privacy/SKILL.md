---
name: siza-security-privacy
description: SIZA security and privacy rules for authentication, authorization, uploads, secrets, logging, headers, rate limiting, webhooks and personal data (POPIA). Use when touching auth, user input, file upload, personal data, environment variables, logging, error handling, or any endpoint.
metadata:
  origin: SIZA
---

# SIZA Security and Privacy

Threat model in one line: attackers want ID photos and addresses, fake cleaner accounts, free jobs, and to read other people's bookings.

## Authentication and authorization
- Supabase Auth; email+password or Google. Passwords never handled by our code. Short-lived sessions; admin MFA required.
- Authorize every request by role AND ownership (`policies/`). A host reads only their bookings; a cleaner only jobs they are eligible for or assigned to.
- Return 404 for resources the caller may not know exist. Same response for existing vs unknown email/phone at sign-up and sign-in.
- Lockout: 5 failed logins per 15 min per account and per IP.

## Input
Zod on every input, `.strict()`, max lengths, allow-lists (suburbs, services, categories). Normalise phones to E.164. Reject, don't sanitise, unexpected fields. Parameterised queries only; never build SQL from strings.

## Uploads (selfies, ID photos)
Max 8 MB; types jpg/png/webp (pdf only where the spec says); validate **magic bytes**, not filename or MIME header; re-encode images server-side and **strip EXIF** (it can contain GPS); random object names; private bucket; signed URLs 60 s; admin-only viewing; all-or-nothing writes (on any failure delete uploaded objects and write no row). Client-side compression to under 500 KB first.

## Secrets
Only in env, validated at startup by `lib/env.ts` (Zod). Service-role key, `ID_ENCRYPTION_KEY`, HMAC peppers, webhook secrets are server-only. Rotate on suspicion. `.env*` ignored by git. Encryption/HMAC keys are backed up separately from the database; losing them makes data unreadable.

## Logging and errors
Structured logger with an allowlist of fields (request id, user id, route, status, duration, error code). Never log bodies, tokens, phone numbers, addresses, ID numbers, document paths, or provider payloads. Sentry has PII scrubbing on. Errors shown to users are generic with an incident reference.

## Transport and browser
HTTPS only, HSTS, CSP (no `unsafe-eval`; allow only Supabase, Turnstile, YouTube-nocookie origins actually used), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `frame-ancestors 'none'`, secure + HttpOnly + SameSite=Lax cookies. Server actions rely on Next.js origin checks; route handlers that use cookies verify `Origin`.

## Abuse controls
Rate limits per `siza-api-design`. Turnstile (fail closed) + honeypot on public forms. Check-in code: HMAC-stored, 5 attempts then 15-min lock, admin notified. Duplicate-account checks per `siza-product-domain`.

## Personal data (POPIA)
- Collect only what the spec lists. Workers must be 18+ (date-of-birth check).
- Consent text and version stored with a timestamp for terms, privacy and public-profile consent.
- Retention: ID photos/selfie-check deleted 30 days after decision; ID number erased at decision; `id_hash` kept (state this in the privacy notice); reviews anonymised on account deletion; ledger rows kept.
- Support access, correction and deletion requests: admin procedure + soft delete (`deleted_at`); never hard-delete financial rows.
- Third parties (Supabase, Vercel, Resend, Sentry) are operators: keep a list with data categories and region; legal text is the lawyer's job.
- Breach runbook lives in `docs/runbooks/breach.md` (who to call, what to preserve, notification duties). Do not improvise.

## Supply chain
Pin exact versions, commit the lockfile, `npm audit --audit-level=high` in CI, avoid packages under 14 days old, no postinstall scripts from unknown packages, review every new dependency.

## Review checklist (run on every PR touching these areas)
- [ ] Role and ownership checked server-side; 404/403 choice deliberate.
- [ ] No sensitive data in logs, errors, client bundles, URLs or analytics.
- [ ] Uploads validated by magic bytes, EXIF stripped, private storage.
- [ ] Rate limit + bot check on public endpoints.
- [ ] Idempotent and replay-safe.
- [ ] Tests for the abuse cases, not only the happy path.
