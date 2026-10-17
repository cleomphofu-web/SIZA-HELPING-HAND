# Skill use

| Skill | Rule applied | Files changed because of it |
|---|---|---|
| siza-agentic-workflow | Stop at conflicts and write an evidence-based audit before implementation. | `docs/realign/AUDIT.md`, `docs/realign/GAPS.md` |
| siza-architecture | Document the planned `src/` boundary and preserve reusable server work. | `docs/realign/AUDIT.md` |
| siza-product-domain | Treat helper as the product term and protect existing domain/backend work from deletion. | `docs/realign/AUDIT.md` |
| siza-brand-voice-and-copy | Make the copy deck the future text source and flag obsolete copy. | `docs/realign/AUDIT.md` |
| siza-legal-guardrails | Retain legal and payment gates; do not publish unsupported claims. | `docs/realign/GAPS.md` |
| siza-design-fidelity | Do not invent token values while the required design extraction is missing. | `docs/realign/GAPS.md` |
| siza-frontend | Retain accessibility and low-data requirements for surviving UI. | `docs/realign/AUDIT.md` |
| siza-testing-tdd | Use the required check outputs as audit evidence and retain security-focused tests. | `docs/realign/AUDIT.md` |
| siza-security-privacy | Classify routes and privacy controls as REUSE, but gate live public collection. | `docs/realign/AUDIT.md`, `docs/realign/GAPS.md` |
| siza-api-design | Classify public POST routes for prototype 404 gating. | `docs/realign/AUDIT.md` |
| ui-ux-pro-max | Preserve accessible touch, form and responsive design rules. | `docs/realign/AUDIT.md` |
| frontend-a11y | Require native semantics, visible labels and keyboard support in future UI work. | `docs/realign/AUDIT.md` |
| react-patterns | Preserve server/client boundaries in the planned move. | `docs/realign/AUDIT.md` |
| react-performance | Retain low-JS and low-data constraints. | `docs/realign/AUDIT.md` |
| architecture-decision-records | Record ADRs as a later explicit batch. | `docs/realign/GAPS.md` |
| verification-loop | Record failed/missing gates without weakening them. | `docs/realign/AUDIT.md` |
| conventional-commit-review | Keep batches focused and independently reversible. | `docs/realign/AUDIT.md` |
| coding-standards | Avoid duplicates; favour focused modules during the move. | `docs/realign/AUDIT.md` |
