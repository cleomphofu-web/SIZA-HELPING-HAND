# Realignment read log

## 1. `AGENTS.md`

- Replaces the former root instructions; preserve `app/AGENTS.md` as a nested rule set.
- Calls the worker a helper in code, UI, and copy, even where inherited material says cleaner.
- Requires server-only data access, explicit authorisation, and no real data handling in public prototype routes.
- Establishes copy, design tokens, domain schema, routes, and assets as single sources of truth.

## 2. `docs/SIZA-v2-spec.md`

- Retain Phase A backend safeguards, but keep all money-holding and payout code out of scope pending the Phase B legal gate.
- Rename surviving cleaner terminology and routes to helper equivalents; retain data-migration history unchanged.
- Use helper-facing redacted booking data, fair offers, and direct host payment only where existing implementation survives.
- Restrict the prototype to claim-safe public behaviour and document any later schema changes rather than editing applied migrations.

## 3. `docs/ux/ux-blueprint.md`

- Align public navigation and calls to action to “Request a helper” and “Apply to be a helper”.
- Preserve only Home cleaning (including Airbnb turnover) as bookable; other service cards must be coming soon.
- Treat host, helper, and admin route surfaces as separate navigation/layout concerns; do not build missing screens in this task.
- Use the Framer-derived design tokens when available; do not retain Interio branding or unapproved stock people imagery.

## 4. `docs/copy-deck.md`

- Make the copy deck the only source for surviving public text; generated copy must replace inline UI strings in later work.
- Remove obsolete cleaner wording, “first month free”, unsupported claims, invented proof, and legacy calls to action.
- Keep the demo notice and legal/owner placeholders visible rather than claiming the prototype is live.

## 5. `docs/ux/about-page.md`

- Do not build an About page in this clean-up; record it as a missing blueprint screen.
- Any future About page must reuse shared visual components and copy-deck keys, with no invented founder facts or people imagery.
- Keep consent and asset-credit requirements for any future people imagery.

## 6. `docs/ASSET_MANIFEST.md`

- Remove template images, videos, hotlinks, and Interio assets unless explicitly approved in the manifest.
- Preserve the managed `public/assets/images/` tree and validate future image usage through manifest slots.
- Do not add stock people imagery; missing slots remain clear development placeholders.

## 7. `docs/rate-card-draft.md`

- Treat listed rates and transport amounts as draft inputs, not hard-coded product facts.
- Keep pricing logic only if it is reusable, with numbers sourced from configuration or documented seeds.
- Do not add or alter payment collection in this clean-up.

## 8. `docs/plans/siza-phase-a.md`

- Keep useful Phase A safety and backend foundations, but do not extend features beyond the current cleanup scope.
- Move to the documented `src/` layout and capture structural decisions in architecture documentation and ADRs.
- Record missing design approval, legal placeholders, and missing screens as gaps rather than implementing them.

## 9. `docs/EXTERNAL_SKILLS.md`, `docs/agent-pack-readme.md`, `tools/design/README.md`, `docs/design-reference/`

- Keep third-party skills pinned and subordinate to SIZA rules; their licences and lock file are installed locally.
- Design extraction cannot proceed: `DESIGN_TOKENS.md`, Framer export, and screenshots are missing, and Chromium cannot be downloaded because DNS cannot resolve the Playwright CDN.
- Do not create design tokens or replace styles from guesswork; this requires extraction and owner approval.

## 10. SIZA skills

- `siza-agentic-workflow` -> keep the work reversible, define gaps and stop at owner decisions.
- `siza-architecture` -> use the documented `src/` boundaries and keep backend rules server-side.
- `siza-product-domain` -> rename product-facing terminology to helper and preserve redaction/state-machine work as reuse.
- `siza-brand-voice-and-copy` -> use the copy deck and remove obsolete public wording and claims.
- `siza-legal-guardrails` -> do not publish invented legal terms or introduce Phase B money handling.
- `siza-design-fidelity`, `siza-frontend`, `siza-testing-tdd`, `siza-security-privacy`, `siza-api-design` -> gate prototype routes, avoid invented visual values, preserve security tests, and require explicit API validation.

## 11. Third-party skills

- `ui-ux-pro-max`, `frontend-a11y`, `react-patterns`, `react-performance` -> keep the surviving UI semantic, low-data, mobile-first and server-first.
- `architecture-decision-records`, `verification-loop`, `conventional-commit-review`, `coding-standards` -> record the source-layout and reuse decisions, run gates, use focused commits and avoid duplicate abstractions.

## 12. Superseded root documents

- `DESIGN_BRIEF.md` -> preserve its asset-consent caution only; its older visual and cleaner terminology conflict with the v2 documents.
- `DESIGN_DIRECTIONS.md` -> archive: it is explicitly historical and conflicts with the Framer-token direction.
- `LANDING_PAGE_CONTENT.md` -> archive: its routes, wording, placeholder content, and service model are superseded by the copy deck and blueprint.
- `SECURITY_REVIEW.md` -> preserve its findings on private storage, encryption, RLS testing, Turnstile and sender readiness in `GAPS.md`.
