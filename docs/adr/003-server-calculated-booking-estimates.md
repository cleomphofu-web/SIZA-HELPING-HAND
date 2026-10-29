# ADR 003: Server-calculated booking estimates

## Status

Accepted by the owner on 2026-10-24 for the estimator rule. The implementation and migration still require local Supabase verification and final review.

## Context

The host form previously accepted `estimatedMinutes` and `endAt` from the browser, then used the submitted duration to calculate pay. Spec 6.6 requires the estimate to come from the rate card and home details. The rate card stores service rates, room durations and add-on durations; the size-band duration was missing from the schema.

## Decision

- Hosts provide a primary service, selected services, bedrooms, bathrooms, size band, add-ons, location, start time, helper count and preference.
- The primary service supplies duration factors. Its configured size-band, bedroom, bathroom and selected add-on minutes determine the estimated duration.
- Add the hourly rates for all selected services, then apply that combined rate for the full estimated duration. The owner confirmed this rule.
- The server derives the end time, recommended pay and transport amount. A host may raise pay and transport; the server enforces the configured pay floor and area transport suggestion.
- Store the estimator inputs and calculated minutes with the booking. Never trust browser-supplied duration, end time, recommended price or suggested transport.
- Service availability, rate cards, duration values, size-band mappings and transport values come from database configuration. Missing or disabled configuration fails closed. Do not seed invented rates or time values.
- Open a suburb/service combination only when at least three approved helpers offer that service in the suburb.
- The booking row and first-round helper offers are one database transaction. A failed or incomplete offer set must not leave a stranded booking; retries with the same host/idempotency key return the original booking.
- When several services are selected, an offered helper must be approved, subscription-eligible, and able to perform every selected service.

## Schema and implementation

Forward-only migration `0018_booking_estimator_inputs.sql` adds `size_band_minutes` to `rate_card` and the estimate snapshot, calculated minutes, and gender preference to `phase_a_bookings`. Migration `0019_atomic_host_booking_creation.sql` makes request creation and initial offers atomic, enforces full service coverage, checks enough distinct eligible helpers for the requested helper count, and rotates each slot's three-offer window through the ranked candidates. Existing requests may retain NULL estimator snapshots. Both migrations are written but not locally applied while Docker is unavailable. `supabase/migrations/0001_init.sql` is already applied and remains unchanged.

Pure arithmetic lives in `src/lib/booking-estimate.ts`; trusted configuration loading and server persistence stay in `src/server/views/booking-form-read.ts` and `src/server/services/phase-a.ts`. Client preview math is advisory and the server recomputes it before insertion. The form opens an accessible confirmation dialog after native validation; only its confirmation submits the request.

## Consequences

The host form cannot submit a request until its service and suburb configuration is present and enough approved, subscription-eligible helpers cover every selected service. Helper-count choices are capped to the eligible distinct-helper count and the server and SQL transaction independently recheck capacity. The admin rate-card and settings screens must provide values before a pilot. The three size-band labels need owner-defined boundaries before hosts can reliably choose among them; these boundaries are not inferred from the home's property type.

The migrations and RLS/service integration must be tested against local Supabase before the feature is considered complete. The linked project remains read-only; never edit `0001_init.sql`.
