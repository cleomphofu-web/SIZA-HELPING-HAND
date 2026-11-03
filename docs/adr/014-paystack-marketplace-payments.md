# ADR 014: Paystack marketplace payments with append-only ledger

**Status:** Accepted (owner approved Phase B plan 2026-11-03)  
**Date:** 2026-11-03

## Context

Phase A bookings are free (no money changes hands through siZa). Phase B introduces card payments from hosts and tracked payouts to helpers. The spec (8.1) requires legal and accounting advice before holding funds; the owner confirmed clearance in writing by approving the Phase B Marketplace Implementation Plan on 2026-11-03.

siZa operates in Johannesburg, South Africa. Hosts pay per booking; helpers receive their full pay plus transport; siZa charges a service fee on top.

## Decision

### Provider: Paystack (SA)

Paystack hosted checkout handles card collection. Card data never touches siZa servers (minimal PCI scope). Payment confirmation is via HMAC-SHA512 verified server-to-server webhook only; browser redirects are never trusted.

Alternatives rejected:
- **PayFast:** Split payments are instant to PayFast accounts only; no escrow or delayed settlement.
- **Ozow:** Instant EFT only (no card); acceptable as a future secondary channel, not primary.
- **PayPal:** Cannot receive or hold ZAR in SA accounts; poor fit for local marketplace.

### Fee split (all amounts integer cents, bigint)

- `host_pays = (pay_per_helper_cents + transport_per_helper_cents) × helpers_needed + service_fee_cents`
- Helper receives 100% of `pay_per_helper_cents + transport_per_helper_cents`.
- `service_fee_cents` is siZa's revenue, configured in `app_config` as a percentage plus minimum.
- The service fee is shown as an explicit separate line item before payment.

### Append-only ledger

Every financial event writes one or more `ledger_entries` rows in a single database transaction. Entry kinds: `host_payment`, `held`, `platform_fee`, `helper_payable`, `payout`, `refund`, `adjustment`. A PostgreSQL trigger prevents UPDATE and DELETE on the ledger table.

Reconciliation invariant: for every booking, `sum(host_payment) - sum(refund) = sum(platform_fee) + sum(helper_payable)`.

### Payouts (Phase B1): manual EFT

Admin views the payable balance per helper, pays via EFT to the verified bank account, and records the payout with a reference. Automated payouts via Paystack Transfers API are deferred to Phase B2 when volume justifies.

### Cancellation and refund policy

- Host cancels before assignment: full refund.
- Host cancels >4 hours before start: full refund.
- Host cancels <4 hours before start: R100 helper transport compensation, remainder refunded.
- Helper no-show: full refund to host, strike to helper, slot re-offered.
- TODO(owner): confirm exact cancellation fee amounts and policy text with legal counsel.

### Webhook verification

Raw body HMAC-SHA512 with `PAYSTACK_WEBHOOK_SECRET`. Reject stale timestamps. Idempotent by unique `provider_ref`. Amount and currency checked against expected totals. Respond 200 immediately.

### Mock adapter

When `PAYSTACK_SECRET_KEY` is absent, a `MockPaymentProvider` is used. It returns deterministic checkout URLs and accepts all webhooks with a test signature. This enables local development and CI testing without Paystack credentials.

## Consequences and limits

- Card data never enters siZa infrastructure; Paystack's PCI-DSS compliance covers card handling.
- Webhook endpoint must be publicly accessible; local development uses the mock adapter.
- EFT payouts are manual in Phase B1; this is acceptable for pilot volumes but does not scale.
- Paystack gateway fees are borne by siZa and must be accounted for in financial reporting (TODO(owner): confirm fee treatment with accountant).
- Bank account holder name must match verified ID name to prevent payout fraud.
- Refunds are processed through Paystack's refund API when the original payment was via Paystack.
- If Paystack does not support delayed settlement or escrow for SA merchants, funds flow through immediately and the ledger tracks the obligation. TODO(owner): verify Paystack SA settlement terms.

