---
name: siza-architecture
description: SIZA code structure and architectural decisions for Next.js App Router, TypeScript, Supabase. Use when creating files or folders, deciding where logic lives, adding a service, config, background work, error handling, observability, dependencies, or an ADR.
metadata:
  origin: SIZA
---

# SIZA Architecture

## Principles
1. Simple over clever. One way to do each thing. YAGNI: no abstraction until the second use, except the three below (state machine, PaymentProvider, redacted views).
2. Business rules live in `src/server/services`, never in components, route files or SQL strings scattered around.
3. The database is the last line of defence (RLS, constraints, triggers), not the first. Validate in services, enforce in Postgres.
4. Every dependency is a cost and an attack surface. Prefer platform features.

## Layout
```
src/
  app/
    (public)/        landing, how-it-works, privacy, terms
    (host)/host/...  host area, own layout
    (cleaner)/cleaner/...  cleaner area, own layout (never share state with host)
    (admin)/admin/...
    api/webhooks/... external callbacks only (raw body)
  server/            ALWAYS `import 'server-only'`
    db/              the only place that creates Supabase clients (service-role)
    services/        business logic (booking, offers, cleaners, subscription, reports)
    policies/        authorize(user, action, resource) per role + ownership
    views/           redacted DTO builders by role and booking state
    payments/        PaymentProvider interface (+ Phase B adapters)
    email/           templates + sender (idempotent)
    config/          app_config reader with short cache
  lib/               pure shared code (zod schemas, money, phone, dates); no I/O
  components/        UI only
supabase/migrations/ SQL migrations (source of truth for schema)
docs/                spec, design brief, ADRs
```
Enforce with ESLint `no-restricted-imports`: `components/**` and client files cannot import `server/**`; only `server/db` imports the Supabase service client.

## Request flow
UI → server action or route handler → Zod parse → `authorize()` → service → db → `views` redaction → typed `Result`. Server actions are public POST endpoints: authorize inside every one.

## Three deliberate abstractions
- `transition(booking, event)` state machine (one module, table-driven).
- `PaymentProvider` interface (Phase B; stub only in Phase A).
- Redacted view builders (`viewBookingForCleaner(booking, viewer)`), so the UI cannot leak fields.

## Config, not constants
Business numbers (offer window, grace hours, no-show minutes, fee %, subscription price/period, floor %, strike limit) live in `app_config` / `rate_card` / `transport_zones`, editable by admin, read through `server/config`. Never hard-code them.

## Time and money
UTC in DB, Africa/Johannesburg in UI. Money is integer cents with a tiny `Money` helper in `lib/money.ts`; format with `Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' })`. No floats for money anywhere.

## Background work (keep it minimal)
Prefer computing at read time (offer visibility, expiry). Where a scheduled job is unavoidable (photo deletion 30 days after decision, reminders, expiry sweep), use one Supabase scheduled function or Vercel cron calling an authenticated route; jobs must be idempotent and safe to run twice.

## Errors and observability
- Typed errors: `AppError(code, httpStatus, publicMessage)`. Never leak internals; unknown errors become `internal_error` with an incident id.
- Sentry (PII scrubbing on) on server and client; the user sees "Something went wrong. Reference: {id}".
- `audit_log` for approvals, suspensions, review hiding, refunds, payout marks (no personal data in rows).
- Structured logger with an allowlist of loggable fields (see security skill).

## Cost guardrails
No maps, SMS, chat, AI or extra queues at launch. Compress images client-side; set DB statement timeouts; paginate everything; index every foreign key; watch table sizes in `/admin/overview`.

## Decisions need an ADR
Any new dependency, provider, table family, or deviation from the spec: write `docs/adr/NNN-title.md` (context, decision, alternatives, consequences) before coding.

## Checklist
- [ ] Logic is in a service, not a component or route.
- [ ] No client import of `server/**`.
- [ ] New numbers are config.
- [ ] Error paths return typed errors; nothing leaks.
- [ ] ADR written if structure or dependencies changed.
