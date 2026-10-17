# Realignment gaps

## Blocking decisions and prerequisites

1. **Design tokens** — `docs/design-reference/DESIGN_TOKENS.md`, Framer export, and reference screenshots are absent. The required Chromium download failed because `cdn.playwright.dev` could not be resolved. Do not create or alter visual tokens until extraction completes and the owner approves the result.
2. **Applied migration status** — `supabase/migrations/0001_init.sql` is legacy (`cleaners`, legacy booking fields). It must not be edited if it has been applied. The owner must confirm whether it has ever been applied to a development or remote Supabase project; the recommended default is to treat it as applied and add a new forward-only migration later.

## Implementation gaps to record, not build in this cleanup

| Screen | Blueprint section | Frontend-prompt stage |
|---|---:|---:|
| Public About, Request, Apply, Contact, Terms, How it works | 2 | 2 |
| Host app, onboarding, booking flow, activity and account | 3 | 3 |
| Helper onboarding, jobs, plan and account | 4 | 3 |
| Admin overview, reports, settings, payments and audit log | 5 | 4 |

## Security and launch follow-ups retained from archived material

- Use no real public data collection while the prototype gate is off.
- Before real users: validate encrypted-ID configuration, RLS against a real local/test database, Turnstile, sender/domain configuration, headers and CSP, and independent auth/upload review.
- Lawyer-owned privacy, terms, retention and Phase B payment wording remain unresolved; retain `{{LEGAL_TEXT_PENDING}}` and owner markers.
- The copy build currently reports 19 owner/legal confirmation markers; strict production copy cannot pass until they are resolved.
