# ADR 004: Optional soft gender preference matching

## Status

Accepted by the owner on 2026-10-25. Implementation is Phase A and remains unavailable for real user data until the opt-in wording and privacy notice receive owner/lawyer review.

## Context

The host request stores `gender_pref`, and the form offers `any`, `female`, `male`, and `mix`. The helper schema had no matching field, and the offer query did not honor the preference. The owner authorized one narrow, soft gender preference and explicitly ruled out matching on any other personal characteristic.

## Decision

- Service, suburb, availability, approval, and subscription rules define job eligibility. Gender never changes eligibility or capacity checks.
- A helper may voluntarily provide one self-described matching category, `female` or `male`. A helper who leaves it unset remains eligible and is not assigned an inferred category.
- A host's `female` or `male` choice is a ranking tie-break only, after the existing fair-rotation metrics. A matching helper may be offered first among equal-fairness candidates; all other eligible helpers remain candidates and become visible after the regular offer window.
- `mix` alternates the preferred category by slot (`female` on odd slots, `male` on even slots) as the same soft tie-break. It does not guarantee the assigned group composition.
- Gender is the only person attribute that may affect offer ranking, and only as the optional soft tie-break above. Names, photos, age, race, experience, ratings, and every other person attribute are never matching inputs. The helper's category is private: it is used only by the offer-ranking function and the helper's own settings view, and is absent from host/admin DTOs, public profiles, logs, and analytics.
- Record an explicit opt-in timestamp and copy version with a selected helper category. Clearing the category clears the matching consent fields. The exact consent and privacy-notice wording remains `TODO(owner/lawyer)`; keep live collection gated until approved.

The feature gate is enforced by `app_config.helper_gender_matching_enabled`, forced to `false` by the privacy-gate migration even if a prior local/config value was true. While false, the helper setting is not shown or writable, existing helper categories do not affect ranking, and the host request form omits the gender preference. A future admin settings action may enable it only after the exact opt-in and privacy notice have received owner/lawyer approval. Prototype-route enablement alone does not open this gate.

`helper_details` is server-only because it contains private application and matching fields. Authenticated Supabase clients have no table privileges on it; application pages and APIs access it only through server-side, role-checked views and services. Admin membership does not grant a direct Data API read. The category is returned only in the signed-in helper's redacted settings view, while database ranking functions read it internally. This closes the column-privacy gap because Postgres table-level `SELECT` cannot hide an individual column once granted.

## Schema and implementation

Migration `0020_soft_gender_preference_matching.sql` adds only the nullable matching category and its opt-in timestamp/version to `helper_details`, then replaces the offer-ranking function. Migrations `0018` and `0019` are prerequisites. `0001_init.sql` and all previously applied migrations remain immutable.

The host's stored `gender_pref` remains in `phase_a_bookings`. The helper's private setting is edited through a dedicated owner-scoped API and settings view, separate from the existing upload-heavy onboarding route. The candidate count and acceptance checks ignore the preference; only initial offer ordering uses it.

## Consequences

- A helper may decline or clear the preference without losing eligibility or affecting existing fair-workload ordering.
- Hosts cannot request a guaranteed gender composition. Existing UI labels and explanatory copy must describe it as a preference, not a filter or promise.
- The setting is not ready for real collection until the owner/lawyer approves the exact notice and retention description. No new demographic data is exposed to hosts or admins.
- Apply and test migrations only on local Supabase; never write to the linked project without fresh explicit authorization.
