# SIZA

Johannesburg-first cleaning marketplace built with Next.js, TypeScript, Tailwind CSS, Supabase, and Resend.

## Local setup

1. Install Node.js 20 or newer.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local` and fill in the values. Never commit `.env.local`.
4. Set `ID_ENCRYPTION_KEY` to base64 encoding of exactly 32 random bytes. Generate one with `node scripts/generate-encryption-key.mjs`, then paste the output into `.env.local`.
5. Apply `supabase/migrations/0001_init.sql` to the Supabase project.
6. Add the first owner’s Supabase Auth user ID to `public.admins`.
7. Run `npm run dev`.

## Required services

- Supabase URL, anon key, and service-role key. The service-role key is server-only.
- Resend API key and a verified sender once a SIZA domain is available. The Resend test sender is for development only.
- Upstash Redis for rate limiting.
- Cloudflare Turnstile. Turnstile credentials remain unset until SIZA has a domain; public submissions must not be enabled in production before it is configured.

## Security notes

- Cleaner identity documents are stored in the private `cleaner-docs` bucket and served only through short-lived admin signed URLs.
- ID numbers are encrypted with AES-256-GCM before storage and never logged.
- Public submission routes require rate limiting, honeypot validation, Turnstile verification, and server-side schema validation.
- Admin authorization is checked server-side on pages and actions.

## Current state

The public landing, booking, cleaner application, and privacy surfaces are present. The booking and cleaner application routes, Supabase schema, admin authorization, vetting actions, booking assignment actions, and email wiring are implemented. Before launch, install dependencies, configure the services, add the supplied brand assets, complete the landing-page design-direction review, and run the security and test phases.
