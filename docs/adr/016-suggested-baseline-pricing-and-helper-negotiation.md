# ADR 016: Suggested Baseline Pricing & Helper-Host Rate Negotiation

## Status
Accepted

## Date
2026-11-10

## Context
Under the initial Phase A design, booking estimates were calculated on the server using fixed rate-card formulas (e.g. R100/hr + transport) without room for nuance. In practice:
1. Certain tasks require heavier labor or unique conditions (e.g. deep garden overgrowth, post-event domestic clean, steep property topography).
2. Helpers receiving job offers at a fixed rate that does not match the actual difficulty frequently ignored or declined offers, leading to unaccepted/ghost requests that expired.
3. The platform principle mandates that **siZa does not dictate prices**. Instead, pricing is an agreement directly between host and helper.
4. However, leaving pricing completely unguided exposes both sides to exploitation: hosts could attempt below-minimum wages, while unscrupulous actors could price-gouge in high-demand windows.

## Decision
1. **Suggested Baseline Rate**: siZa provides an automated baseline estimate (suggested starting rate) derived from property size, task requirements, and transport zones.
2. **Helper Counter-Offer Mechanism**:
   - When a job offer is dispatched to a helper in rotation, the helper has three options:
     - **Accept** at the suggested rate.
     - **Decline** (job immediately passes to next helper in rotation with zero penalty).
     - **Propose Rate** (counter-offer with an adjusted rate + optional brief note explaining why).
3. **Exploitation Guardrails (Floor & Ceiling)**:
   - **Floor**: Counter-offer pay cannot fall below the statutory minimum or floor rate set in `app_config.floor_percent`.
   - **Ceiling**: Counter-offer cannot exceed a configurable cap (default: $+35\%$ above suggested rate) to prevent price gouging.
4. **Host Approval**:
   - The host receives instant notification of the helper's proposed rate.
   - If the host accepts, the job is confirmed at the agreed rate.
   - If the host declines the proposal, the request returns to the fair rotation queue at the original suggested rate.
5. **Phase A Direct Settlement**:
   - As per Phase A rules, siZa holds zero money and takes zero commission from helper earnings. The agreed rate is paid directly by host to helper via cash or instant EFT.

## Consequences
- Prevents ghost requests on difficult jobs by giving helpers agency to price their time fairly.
- Reinforces user ownership of pricing while maintaining transparent baseline standards.
- Preserves the integrity of the append-only ledger and fair rotation algorithms.

