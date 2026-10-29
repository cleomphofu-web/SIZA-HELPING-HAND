# ADR 012: Require TOTP MFA for admin access

**Status:** Accepted for Phase A implementation  
**Date:** 2026-10-27

## Context

Phase A requires MFA for the owner admin account. The current admin login only checks email and password. Admin pages and actions share a server-side authorization helper, so it is the right boundary for enforcing the second factor.

## Decision

Use the existing Supabase Auth TOTP MFA support. After password sign-in, an admin without a verified TOTP factor must enroll one; an admin with a verified factor must complete a challenge. Admin pages, server actions, and admin data views require an `aal2` session as well as the persisted admin profile and `admins` membership. MFA setup and challenge screens require an authenticated admin identity but allow `aal1` so the user can complete the second factor.

Supabase session cookies are `HttpOnly`, `SameSite=Lax`, `Secure` in production, and expire after one hour of inactivity. Both the server client and Next.js Proxy use the same cookie options; authenticated server page reads refresh the session.

The enrollment secret is returned only to the current authenticated admin's browser for setup. Do not put it in URLs, logs, analytics, or persistent app storage. No new package or MFA vendor is introduced; one private, short-lived digest table is used for replay prevention. No linked-project configuration is introduced.

TOTP verification uses a separate Postgres-backed `mfa_verify` bucket of five submissions per account per 15 minutes. The shared request pipeline consumes the bucket before validation and verification, so every submission counts; exhaustion denies further attempts until the configured window expires. The limit is configurable in `app_config`, fails closed when unavailable, and does not alter the separate password-login lockout or lock the admin account indefinitely.

Supabase Auth accepts the same TOTP again on a fresh challenge during its time step, so reserve each submitted code before calling Supabase verification. Store only a service-keyed HMAC of the code with the factor UUID in a private table; never store the OTP itself. A unique key makes concurrent reservations atomic, and the configured replay window (default 90 seconds, bounded to 30–300) expires the digest. If reservation fails or the database is unavailable, do not call Auth verification.

## Alternatives

- SMS codes: rejected because the project has no approved SMS provider and it adds cost and phone-number exposure.
- Email codes: rejected because email would not provide an independent second factor.
- New MFA vendor: rejected because Supabase already supports TOTP.

## Consequences and limits

- A lost authenticator requires an owner-controlled break-glass recovery through Supabase account administration; no app-level recovery or factor-removal screen is included in this slice.
- Keep at least one verified factor for the owner account. Do not remove an active factor through the application.
- Local Supabase tests verify server-side authorization, the OTP flow and MFA attempt expiry with disposable identities. The linked project remains read-only; enabling MFA for its owner account is a separate owner operation.
- Admin login remains inaccessible to non-admin roles even when their password is valid.
