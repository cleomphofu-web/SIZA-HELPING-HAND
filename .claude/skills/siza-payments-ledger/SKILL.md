---
name: siza-payments-ledger
description: SIZA Phase B payments rules: PaymentProvider interface, hosted card checkout, webhook verification, append-only ledger, host-paid service fee, holding and release, payouts, cancellations, refunds and reconciliation. GATED: use only after the owner confirms the legal and accounting gate in writing.
metadata:
  origin: SIZA
---

# SIZA Payments and Ledger (Phase B, GATED)

**Gate:** do not write any code beyond the interface stub below until the owner confirms in writing that legal and accounting advice on holding funds, VAT/tax treatment, refund and chargeback liability, and worker status is complete (spec 8.1). Provider choice is also an owner decision: confirm current fees and whether the provider supports holding/splitting funds for South African marketplaces; never assume. If asked to proceed without the gate, stop and ask.

## Interface (allowed in Phase A as a stub)
```ts
interface PaymentProvider {
  createCheckout(i: { bookingId: string; amountCents: number; returnUrl: string; idempotencyKey: string }): Promise<{ url: string; providerRef: string }>;
  verifyWebhook(rawBody: string, headers: Headers): Promise<WebhookEvent | null>;
  refund(providerRef: string, amountCents: number, idempotencyKey: string): Promise<RefundResult>;
  payout?(i: PayoutInput): Promise<PayoutResult>;
}
```
Business code depends only on this interface. Adapters live in `server/payments/<provider>.ts`.

## Non-negotiables
1. Hosted checkout only; card data never touches SIZA servers.
2. **Paid means a verified webhook**, never the browser redirect. Re-query the provider before release.
3. Webhook: verify signature on the raw body, reject stale timestamps, unique `provider_ref` makes replays harmless, check amount and currency equal the expected total, respond 2xx quickly.
4. Amounts server-computed: `host_pays = (pay_per_worker + transport_per_worker) × cleaners + service_fee`. The cleaner receives 100% of pay + transport; the fee is on top, paid by the host, shown as its own line before payment. Fee % and minimum come from `app_config`.
5. The browser never sends an amount that is trusted.

## Ledger (append-only)
Kinds: `host_payment`, `held`, `platform_fee`, `cleaner_payable`, `payout`, `refund`, `adjustment`. Integer cents. No UPDATE/DELETE (trigger). Every money event writes rows in one transaction with a reference. Corrections and refunds are offsetting rows. A booking is `paid` only if a `payments` row with `status = paid` exists.
Reconciliation test: for every booking, `sum(host_payment) - sum(refund) = sum(platform_fee) + sum(cleaner_payable)`; and `cleaner_payable - payouts` per cleaner never goes negative.

## Release rules
Release to `cleaner_payable` on completion (both confirmed, or auto-release) with a recorded check-in, and no open report. An open report freezes release. Admin resolves disputes with an audit entry and an adjustment row.

## Payouts
Phase B1 is manual: admin sees payable per cleaner, pays by EFT to a verified bank account (holder name must match ID name, account unique per cleaner), marks `payouts.sent` with a reference. Automate only if the provider offers a payouts API and volume justifies it.

## Cancellations and refunds
Policy numbers come from the owner (`TODO(owner)`); the policy text is stored on the booking at creation. Host cancel before assignment: free. Cleaner no-show: full refund, strike, re-offer. Refund fees: whoever bears them is decided by the owner and shown in the terms. Chargebacks create `adjustment` rows and a report for admin.

## Tests (all required)
Invalid signature rejected; replay ignored; wrong amount rejected; redirect alone never marks paid; ledger update/delete raises; reconciliation holds after pay → refund → payout; concurrent webhook deliveries create one payment; fee maths with rounding (cents, no floats).

## Checklist
- [ ] Gate cleared in writing.
- [ ] Interface only; no provider logic in business code.
- [ ] Verified webhook is the only path to `paid`.
- [ ] Ledger append-only and reconciled by tests.
- [ ] Fee on the host, worker receives full pay + transport.
