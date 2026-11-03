# ADR 013: GSAP 3 Animation System for Editorial Motion

## Status
Accepted

## Context
The user requested rich, high-fidelity GSAP animations across every page ("the best of GSAP across every page") to enhance the editorial experience, scroll reveals, interactive cards, micro-interactions, and visual feedback, while maintaining strict adherence to performance constraints (LCP < 2.5s, no layout shift) and accessibility standards (`prefers-reduced-motion` compliance).

Per AGENTS.md Rule 8, any new dependency requires justification and exact pinning.

## Decision
1. Install `gsap@3.15.0` (pinned exactly, release >14 days old).
2. Use GSAP and ScrollTrigger strictly within client components using React-safe patterns (`gsap.context()` for scoped cleanup to prevent memory leaks and duplicate runs in React 19).
3. Respect `prefers-reduced-motion` universally via `window.matchMedia("(prefers-reduced-motion: reduce)")` or `gsap.matchMedia()`.
4. Only animate high-performance properties (`transform`, `opacity`, scale) to prevent layout thrashing and maintain 60fps.
5. Create shared utility hooks and components (`GsapProvider`, `useGsapAnimation`, reveal/stagger triggers) to ensure clean encapsulation and reuse across landing, host, helper, and auth pages.

## Consequences
- Enables smooth page entrance, scroll-triggered reveals, interactive card tilts/staggers, and stat counters.
- Zero server bundle impact (client-only imports).
- Maintains WCAG AA accessibility compliance through reduced-motion media query checks.
