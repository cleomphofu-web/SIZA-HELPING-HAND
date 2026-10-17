# External skills: what to install, why, and the rules

Sources, all MIT, pinned to the commits in `tools/install-external-skills.mjs`. SIZA skills (`siza-*`) always override these on any conflict.

## Install now (Tier 1)
| Skill | Source | Why it fits SIZA | Watch out for |
|---|---|---|---|
| security-review | ECC | Auth, input, uploads, secrets, payment checklists; Next.js + Supabase flavoured | Examples use client-side Supabase queries; SIZA is server-only data access |
| postgres-patterns | ECC | Indexes, RLS, cursor pagination, queue patterns on Supabase | Says avoid random UUIDs; SIZA's spec uses uuid for user-facing ids |
| database-migrations | ECC | Forward-only, safe schema changes, rollback thinking | none |
| api-design | ECC | Status codes, pagination, error shapes, idempotency | Uses a `{data, meta}` envelope; SIZA uses the `Result` shape |
| tdd-workflow | ECC | Red-green-refactor and coverage rules for AI-written code | none |
| e2e-testing | ECC | Playwright patterns for the host-books-cleaner-accepts flow | none |
| react-patterns, react-performance | ECC | Server/client boundaries, Suspense, bundle and render performance (matters on low-end phones and mobile data) | none |
| frontend-a11y | ECC | Forms, focus, ARIA, keyboard support (WCAG) | none |
| error-handling | ECC | Typed errors, retries, user-facing messages | none |
| architecture-decision-records | ECC | Numbered ADRs in `docs/adr/` (the spec requires an ADR for structural changes) | none |
| verification-loop | ECC | Build, types, lint, tests, security scan before "done" | none |
| ai-regression-testing | ECC | Catches blind spots when the same AI writes and reviews code | none |
| safety-guard | ECC | Blocks destructive commands when an agent has database or deploy access | none |
| intent-driven-development | ECC | Turns vague features into testable acceptance criteria | Heavy; use for ambiguous or high-risk features only |
| conventional-commit-review | ECC | Clean commit history | none |
| make-interfaces-feel-better | ECC | Small polish details (spacing, hit areas, states) | none |
| coding-standards | ECC | Baseline naming, immutability, readability | Generic; SIZA skills win |
| design-taste-frontend | taste-skill | Anti-generic art direction for the PUBLIC landing pages | See taste-skill rules below |
| ui-ux-pro-max | ui-ux-pro-max | Local, offline UX rules, palettes, type pairings, chart guidance for app and admin screens | See rules below |

## Add later (Tier 2, `--with-later`)
| Skill | Add when | Why |
|---|---|---|
| santa-method | before merging auth, RLS, uploads, and all Phase B money code | Two independent reviewers must both pass |
| production-audit, canary-watch | pre-launch and each release | "What breaks in prod" and post-deploy checks |
| seo | when the landing page is approved | Local search, Core Web Vitals, structured data |
| search-first | when you are about to add a dependency | Check for an existing tool before writing or adding one |
| brand-voice | after you give real writing samples | Replaces the draft voice in `siza-brand-voice-and-copy` |
| i18n-sync | when you start isiZulu, Sesotho or Afrikaans | Keeps locale files in sync |

## Not installed, and why
- **rust-skills (actionbook):** all 38 skills are about Rust ownership, lifetimes, crates and Rust tooling. SIZA is TypeScript. Revisit only if you add Rust (for example a WebAssembly or edge component).
- **taste-skill extras:** `gpt-taste` (heavy GSAP animation), `industrial-brutalist-ui`, `minimalist-ui`, `high-end-visual-design` (competing aesthetics: pick one direction, which is already SIZA's own brief), `imagegen-*`, `image-to-code`, `brandkit`, `stitch-design-taste` (need image generation or Google Stitch), `full-output-enforcement` (forces exhaustive output, which fights the one-small-task-at-a-time rule), v1 and v2-experimental copies.
- **ui-ux-pro-max extras:** `design-system` (slides tooling that downloads stock backgrounds), `brand`, `design` (logo and CIP generation), `banner-design`, `slides`, `ui-styling` (pushes shadcn/ui and Radix: a dependency decision that needs an ADR first).
- **ECC extras:** `gateguard` (42 KB hook-based gate; too heavy), `nextjs-turbopack` (Next 16 only), `backend-patterns`, `frontend-patterns`, `accessibility` (overlap with the ones installed), healthcare, HIPAA, finance, billing, Stripe and trading skills (different domains). Too many overlapping skills dilute the agent's attention.

## Rules for third-party skills (put in AGENTS.md, already added)
1. **Precedence:** `AGENTS.md` and `siza-*` skills, then the spec, then these. If one conflicts, follow SIZA's and tell the owner.
2. **taste-skill (design-taste-frontend):**
   - Use only for the public landing pages, and only after `docs/DESIGN_BRIEF.md` is approved. The Framer template and its extracted tokens (`siza-design-fidelity`) override any "direction" the skill deals; use the skill only for pages the template has no reference for.
   - **Never use stock or placeholder photos of people.** Its `assets.mjs` downloads open-licence images and its library uses Lorem Picsum photographs. SIZA's rule is real photos with consent only; for people use no photo, an illustration, or type. Do not run `assets.mjs` for people imagery.
   - Its scripts (`lint.mjs`, `inspect.mjs`, a browser tool) run locally and need Node; read a script before first running it.
3. **ui-ux-pro-max:** run its Python search script as `python3 .claude/skills/ui-ux-pro-max/scripts/search.py ...` (the `${CLAUDE_PLUGIN_ROOT}` path in its docs only works when installed as a plugin). Do not use `--persist` outside `design-system/` in the repo, and never put private data in queries. Its guidance is advice, not a spec: SIZA's brief and accessibility rules win.
4. **Supply chain:** third-party skills are prompts and scripts that steer your agent. They are pinned to commit SHAs; upgrade by changing the SHA after reading the diff. The installer copies files only and strips execute permissions. Keep each skill's licence and credit.
5. **Context budget:** keep Tier 1 small. Load a skill only when the router says so.
