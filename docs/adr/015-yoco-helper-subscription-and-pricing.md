# ADR 015: Yoco Payment Link Helper Subscriptions & Fixed R120 Fee

**Status:** Accepted (owner directive 2026-11-07)  
**Date:** 2026-11-07

## Context

In SIZA Phase A, helpers pay a prepaid monthly subscription to access fair rotation job offers after completing their first introductory job. Previously, the system prototyped retail voucher codes (1Voucher, OTT, Blu Voucher) priced at R150/month.

The owner directed:
1. Standardize helper subscriptions strictly onto **Yoco payment links** for safe, card/instant-EFT processing.
2. Fix the monthly subscription fee at **R120.00** (12,000 cents in `app_config`).
3. Enforce strict **double-charge prevention** so helpers are never charged twice or duplicate-credited.
4. Make the **exhausted introductory free job paywall 100% visible** on the helper jobs dashboard (no generic "no jobs" ambiguity).
5. Provide a **simple step-by-step payment guide** tailored for non-tech-savvy helpers, backed by direct WhatsApp support.

## Decision

### 1. Payment Provider: Yoco Payment Link
- SIZA uses a dedicated Yoco hosted payment link (configured in `app_config` under `yoco_payment_link_url`, defaulting to `https://pay.yoco.com/siza` or customizable via admin/env).
- Helpers tap "Pay R120 via Yoco", opening Yoco's mobile-friendly checkout supporting Debit Cards, Credit Cards, and Capitec Pay.
- Card details remain strictly on Yoco's PCI-DSS compliant checkout.

### 2. Pricing & Storage (Integer Cents)
- Monthly fee is fixed at `12000` integer cents (R120.00).
- Stored centrally in `app_config.subscription_monthly_cents`.
- SIZA takes zero commission from helper job earnings; the subscription is prepaid and deliberate (no surprise debit orders).

### 3. Double-Charge & Duplicate Safeguards
- **Database Unique Constraint:** Added unique index `phase_a_sub_payments_ref_unique_idx` on `lower(trim(reference))` in `phase_a_subscription_payments`.
- **Submission Tracking:** Added `phase_a_yoco_submissions` table with unique constraint on `lower(trim(reference))`.
- **Safe Extension Rule:** Early renewals never lose days. If a helper renews while their subscription is still active, the new month starts from `v_helper.subscription_paid_until` (e.g. 10 remaining days + 30 new days = 40 days total).
- **Clear UI Warning:** If a helper opens the renewal modal while active, the UI clearly displays remaining days and reassures them that days will be added on without penalty or double-charging.

### 4. Locked Paywall Visibility
- When a helper has completed their first job (`isPastFirstJob = true`) and has no active subscription (`!isActive`):
  - The helper jobs screen (`/helper/jobs`) replaces the misleading "No Available Jobs" placeholder with a prominent, locked **Introductory Free Job Completed** paywall.
  - The paywall makes it crystal clear that jobs in their suburbs are active on the platform and will unlock immediately upon activating their R120 subscription.

### 5. Step-by-Step Payment Guide & Human Fallback
- Numbered 3-step visual cards:
  - **Step 1:** Copy personal reference code (`SIZA-<phone>` or `SUB-...`).
  - **Step 2:** Click Yoco link and pay R120.
  - **Step 3:** Enter payment reference or notify admin for instant activation.
- Direct WhatsApp link pre-filled with helper ID and reference for instant help from the owner.

## Consequences

- Clean separation between host marketplace payments (Phase B Paystack) and helper operational subscriptions (Phase A Yoco).
- Zero accidental double-credits or duplicate settlements.
- Helpers have clear, non-confusing expectations about when and why they need to subscribe.

