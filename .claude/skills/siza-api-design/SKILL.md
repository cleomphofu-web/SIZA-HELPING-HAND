---
name: siza-api-design
description: SIZA conventions for Next.js route handlers, server actions, webhooks, error envelopes, status codes, idempotency, pagination and rate limiting. Use when adding or changing any endpoint, server action, form submission, webhook, or response shape.
metadata:
  origin: SIZA
---

# SIZA API Design

## Choose the entry point
- **Server action**: form and button mutations from our own UI. Use `useActionState` on the client.
- **Route handler** (`app/api/...`): webhooks, cron, anything called by another system, or public JSON.
Both are public POST endpoints. Both do the same five steps, in this order, and both call the same service function:
1. Rate limit (bucket by purpose; key by user id when signed in, else IP). 2. Bot check where public (honeypot, Turnstile). 3. `schema.safeParse(input)` (Zod, `.strict()`, length limits). 4. `authorize(user, action, resource)` (role AND ownership). 5. Service call.

## Result shape (actions and JSON)
```ts
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; fields?: Record<string, string> } };
```
`message` is safe for users and written per `siza-brand-voice-and-copy`. Never include stack traces, SQL, IDs of other users' records or provider errors.

Error codes: `validation_failed`, `unauthenticated`, `forbidden`, `not_found`, `conflict`, `rate_limited`, `locked`, `subscription_required`, `already_taken`, `internal_error`.

## HTTP status (route handlers)
200 OK, 201 Created (+ `Location`), 204 No Content, 400 malformed/validation, 401 not signed in, 403 signed in but not allowed, 404 not found, 409 state conflict or duplicate, 422 only if distinguishing semantic errors from 400, 429 (+ `Retry-After`), 500 never with details, 503 temporary overload.
Anti-enumeration: when a user may not know a resource exists, return 404, not 403. Registration and login responses are identical whether or not an email or phone exists.

## Idempotency
Every POST that creates something or sends something accepts an idempotency key (client-generated UUID in the form, stored in a unique column). A repeat returns the original result and does not send a second email, create a second row, or charge twice.

## Concurrency
Claims and transitions are single conditional statements or one SQL function, never read-then-write in app code. Example: `update ... set cleaner_id = $1 where id = $2 and cleaner_id is null returning *`; zero rows means `already_taken`.

## Webhooks (Phase B)
Read the raw body; verify signature before parsing; reject stale timestamps; look up by unique `provider_ref` (ignore replays); check amount and currency against the expected payment; acknowledge fast (2xx) and do heavy work after; log event ids only.

## Pagination and lists
Cursor pagination (`id > $last`), default 20, max 50. Never `offset` on growing tables. Every list returns only fields from its redacted view.

## Data formats
IDs: uuid strings. Money: integer cents plus `currency: 'ZAR'`. Time: ISO 8601 UTC. Phone: E.164 (`+27...`). Enumerations as lowercase strings.

## Versioning
Internal actions are not versioned. Only external JSON (webhooks, future public API) lives under `/api/v1`. Additive changes only; breaking changes get a new version.

## Rate limit buckets (defaults, tune from data)
`booking`, `apply`, `upload`, `login` (strictest), `accept`, `report`, `code_attempt` (5 then lock). Limits live in `app_config`. Many South African mobile users share carrier IPs: prefer per-user keys after sign-in and keep IP limits generous.

## Checklist
- [ ] Five steps present and in order.
- [ ] Returns `Result` or correct status; no leaks.
- [ ] Idempotent if it creates or sends.
- [ ] Atomic if it claims or transitions.
- [ ] Test for unauthenticated, wrong role, wrong owner, bad input, replay.
