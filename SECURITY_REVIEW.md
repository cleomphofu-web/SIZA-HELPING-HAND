# SIZA security review — current build

This is a living review of the current source tree. It is not a launch approval.

## Verified in source and local checks

- `.env` and `.env.*` are ignored; `.env.example` remains trackable.
- Supabase tables have RLS enabled in the migration.
- Cleaner documents use a private Storage bucket and short-lived signed URLs.
- ID numbers are encrypted with AES-256-GCM before database insertion.
- Uploads use server-side magic-byte validation and an 8 MB limit.
- Public routes use rate limiting, honeypot checks, Turnstile verification, strict schemas, and generic responses.
- Admin pages and server actions require a Supabase session and `admins` table membership.
- Cleaner approval is server-gated by all three vetting checks.
- Booking summaries exclude client phone and email.
- `npm test`, `npm run lint`, and `npm run build` pass locally.

## Not yet launch-verified

- Supabase migration has not been applied to a live project from this workspace.
- RLS behavior needs integration tests against local or hosted Supabase.
- Turnstile cannot be configured until SIZA has a domain; public production submission must remain disabled until then.
- The current `.env` contains an invalid `ID_ENCRYPTION_KEY`; replace it using `node scripts/generate-encryption-key.mjs` before accepting real data.
- Resend sender/domain verification is not complete.
- Rate limiting needs live Upstash verification and abuse tests.
- No production deployment, HTTPS headers, or CSP verification has been performed.
- Supplied logo, wordmark, poster, font, and hero-video assets are not yet in `public/brand/`.

## Required before collecting real identity documents

1. Replace and validate the encryption key.
2. Apply and verify the Supabase migration and private bucket.
3. Configure a domain, Turnstile, HTTPS, and production CSP origins.
4. Complete RLS, authorization, upload, rate-limit, and approval-flow integration tests.
5. Supply and review the final brand assets and selected landing-page direction.
6. Run an independent review of authentication and upload handling.
