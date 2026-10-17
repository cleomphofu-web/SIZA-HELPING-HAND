---
name: siza-frontend
description: SIZA frontend rules for Next.js App Router, React, Tailwind, forms, accessibility, mobile-first and low-data performance, design tokens and motion. Use when building or changing any page, component, form, layout, style, image, animation or loading/empty/error state.
metadata:
  origin: SIZA
---

# SIZA Frontend

Users are mostly on mid-range phones, on mobile data, often in a hurry. Design for 360-375 px first, slow networks and low data.

## Next.js rules
- Server Components by default. `'use client'` only on small leaf components that need state or events.
- Fetch and authorize on the server; pass the component only the redacted view it needs. Never fetch from the browser to Supabase.
- Forms: native `<form>` + server action + `useActionState`. Validate with the same Zod schema on client (for speed) and server (for truth).
- Separate route groups and layouts for host and cleaner; no shared client state between them.
- `next/image` for images, WebP, explicit sizes, lazy by default; `next/font` for fonts (self-hosted at build).
- No localStorage for anything that matters; session is cookies.

## Every list and form has four states
Loading (skeleton), empty (says what to do next), error (what happened + what to do + retry), success (clear confirmation and next step). Missing states fail review.

## Money, time, phone
Format money with `Intl.NumberFormat('en-ZA', {style:'currency',currency:'ZAR'})`. Show time in Africa/Johannesburg with relative hints ("today 09:00"). Phone inputs: `type="tel"`, `inputmode="tel"`, `autocomplete="tel"`, normalise to `+27`. WhatsApp links: `https://wa.me/<digits>` only after the reveal rules allow it.

## Accessibility (WCAG 2.2 AA minimum)
Visible labels (not placeholders), programmatic error association (`aria-describedby`), error summary that takes focus on submit failure, visible focus rings, 44 px touch targets, contrast AA (check every pair on the template palette), no information by colour alone, keyboard-complete flows, `aria-live` for async status, respect `prefers-reduced-motion`. Test with keyboard and a screen reader once per page.

## Design system (from `docs/DESIGN_BRIEF.md`; defaults until approved)
Tokens as CSS variables on `:root` (colours, spacing, radius, type scale) with dark values under `prefers-color-scheme`. Palette, fonts and spacing come from the Framer template (see `siza-design-fidelity` and `docs/design-reference/DESIGN_TOKENS.md`); never invent values. Public pages carry the template's editorial motifs; app screens use the same tokens with plainer layouts and stay fast. Components are few and reused; do not invent a new button style per page.

## Motion
Animate `transform` and `opacity` only. No scroll-jacking. Motion disabled under `prefers-reduced-motion`. The hero video loads after `load`, is poster-only on data saver or reduced motion, and never blocks content.

## Performance budgets
Landing: LCP under 2.5 s on throttled 4G (video excluded); JS under about 150 KB gzipped; no layout shift from images or fonts. App screens: under 100 KB JS per route where possible. No heavy UI, animation, date or chart libraries without an ADR.

## Safety UX
- Important notices are visible before the action button, not hidden in links: agreements outside SIZA, address sharing, payment explanation.
- Destructive or irreversible actions (cancel, confirm job, suspend) use a clear confirm step; money-affecting and accept actions are never optimistic: wait for the server.
- The check-in code is large, copyable, and readable aloud.

## Checklist
- [ ] Server component unless interaction needs a client one.
- [ ] Four states present; works at 375 px; keyboard-complete.
- [ ] Redacted data only; no secrets or PII in props or URLs.
- [ ] Budgets met; images sized; no new heavy dependency.
- [ ] Copy passes `siza-brand-voice-and-copy`.
