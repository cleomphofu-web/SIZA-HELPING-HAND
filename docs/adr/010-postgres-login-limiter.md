# ADR 010: PostgreSQL login failure limiter

## Status

Accepted by the owner on 2026-10-26. Implemented and applied to local Supabase only. The linked Supabase project remains read-only.

## Context

The existing login throttle counted requests by IP through Upstash. It did not distinguish failed authentication from ordinary requests, did not combine account and IP for lockout, and added a paid external service despite the product spec's Postgres default. Applied migration `0001_init.sql` is immutable, so the limiter schema must be added in a forward-only migration.

## Decision

- Use short-lived counters in Postgres, configured by `app_config`, behind the existing server rate-limit seam. Remove the Upstash dependency from runtime configuration.
- Store only HMAC digests of normalized account identifiers, IPs, and the account/IP pair. Never store the raw account identifier or IP in limiter rows.
- After five failed logins for an account/IP pair within 15 minutes, block that pair until the window expires. After 20 failed logins for an account within one hour, require Turnstile on the next login attempt; do not lock the account across IPs.
- Increment counters only after a failed authentication result. Clear the account and current-pair failures on successful login. Fail closed if the limiter cannot be read or updated.
- Keep account enumeration defenses and existing server authorization unchanged. Run counter cleanup through the retention service.
- Add schema only in a new forward-only migration. Never edit applied migration `0001_init.sql` or apply this migration to the linked project without explicit owner authorization.

## Consequences

The launch limiter no longer needs Upstash. Login requests use Postgres for the status check and failure update, which adds database load. The database functions are service-role-only and the counters contain no direct identity values. A person using a new IP may still attempt a login but will be challenged after the account-wide threshold; this design avoids letting one stranger lock the account across all IPs.

## Verification

Unit tests cover HMAC privacy, fail-closed handling, and the account/IP decision seam. Local Supabase integration tests cover the five-failure pair lock, the 20-failure account challenge across distinct pairs, anon denial, the configured generic rate limit, and expired-counter pruning. Production security/session review remains required before real account use.
