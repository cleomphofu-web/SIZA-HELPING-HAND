---
name: siza-legal-guardrails
description: Engineering guardrails that encode SIZA's legal and regulatory risks (worker status, POPIA, consumer law, claims, payments gate). Use when designing penalties, rules or controls on cleaners, consent and retention flows, terms and privacy pages, claims about vetting or safety, or any Phase B money handling. Not legal advice.
metadata:
  origin: SIZA
---

# SIZA Legal Guardrails (not legal advice)

The owner must get a South African lawyer and accountant to review the product before real users and before Phase B. This skill stops code from creating avoidable legal problems. **Legal wording is never invented by an agent: insert `{{LEGAL_TEXT_PENDING}}` and flag it.**

## 1. Worker-status safe design (cleaners are independent)
Control is what pushes workers towards "employee". Therefore:
- Declining or ignoring a job has **no penalty**: no strikes, no ranking loss, no minimum acceptance rate. Rotation only affects who sees a job first.
- Strikes exist only for no-shows after accepting and for misconduct/fraud, each recorded with a reason and a reviewer.
- No required hours, no exclusivity, no uniforms or branding requirements, no instructions on *how* to do the work (the booking states the scope; that is all).
- Price: show a guide and totals; do not add SIZA-imposed discipline around price. If a price floor stays, it is documented as owner policy pending lawyer review (spec 6.6, `floor_percent` config).
- Workers pay SIZA (subscription); in Phase A SIZA never pays workers. Phase B payouts are gated: possible labour-broker/agency implications are for the lawyer.
- Terms must say workers are independent and responsible for their own tax; SIZA does not deduct PAYE.

## 2. Claims and consumer law
- Only claim what the code enforces. "ID and selfie checked by SIZA" is allowed only if the admin Approve action is blocked server-side without the checklist; the "How we vet" page lists exactly the checks performed.
- Banned: guarantee, insured, background checked, secure/escrow payment, "you choose" (before it is true), fake counters or testimonials.
- Required notices (exact text in `siza-brand-voice-and-copy`): agreements outside SIZA; address sharing; payment explanation.
- Show business details, clear prices and totals before a host commits; cancellation and refund rules shown at booking and stored with the booking (consumer-protection and e-commerce rules).

## 3. Personal data
Implement retention and deletion exactly as `siza-security-privacy`. Store consent versions. Information Officer details live in config and the privacy page. Biometric status of selfies is an open legal question: do not add face matching or any automated facial processing.

## 4. Money (Phase B gate)
Do not write payment-holding, split, payout or refund code until the owner confirms in writing that legal and accounting advice on holding funds, VAT/tax treatment and refund liability is done (spec 8.1). Until then only the `PaymentProvider` interface stub exists. Never store card data; hosted checkout only.

## 5. Safety of people
Admin-only access to documents; no public phone numbers; address revealed only after assignment/payment; check-in code; report button on every booking; admin report queue; suspend in one click. Insurance is an open item: do not imply cover.

## 6. Age and minors
Cleaners must be 18+. No features aimed at children.

## Checklist
- [ ] No penalty for declining; strikes only for no-show/misconduct.
- [ ] Every public claim maps to enforced code.
- [ ] Legal text is a placeholder or lawyer-supplied, never invented.
- [ ] Retention jobs and consent records exist and are tested.
- [ ] Phase B code absent until the gate is cleared.
