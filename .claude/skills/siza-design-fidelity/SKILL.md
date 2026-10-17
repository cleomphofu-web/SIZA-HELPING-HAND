---
name: siza-design-fidelity
description: How to rebuild SIZA's pages to match the Framer template pixel-for-pixel using extracted design tokens, reference screenshots and a visual-diff loop, then swap in SIZA copy and remove template leftovers. Use when building or changing any public page, the shared nav/footer/section components, or when a screen must match the template design.
metadata:
  origin: SIZA
---

# SIZA Design Fidelity (Framer template -> Next.js)

Design source: the Framer template at https://siza.framer.website/ (palette, fonts, spacing, motion, layout). It replaces the earlier yellow/black/off-white direction. The owner exported the home and contact pages with a Framer-to-code plugin: that export is **reference material, not code to ship.**

## Sources of truth (in this order)
1. `docs/design-reference/extract/tokens-*.json` (computed styles from the live template, produced by `tools/design/extract-framer-tokens.mjs`).
2. `docs/design-reference/extract/screens/*.png` (full-page screenshots at 375, 768, 1440).
3. `docs/design-reference/framer-export/` (the plugin's code: read for structure, exact values, animation timings, breakpoints).
4. `docs/design-reference/template-copy.md` (the template's original text, used for the fidelity pass).
Never invent a colour, font size, spacing or radius that is not in these. If a value is missing, ask the owner or measure it.

## How to treat the Framer export
- Keep it in `docs/design-reference/framer-export/`. Exclude that folder from `tsconfig`, ESLint, tests and the production build. Never import from it.
- Copy **values** (hex colours, px sizes, durations, easings, breakpoints), not **structure** (absolute positioning, inline styles, Framer runtime wrappers, `data-framer-*` attributes).
- Rebuild with semantic HTML, our components, Tailwind or CSS variables, and the tokens file. Use `motion` or Framer Motion only if CSS cannot do the effect and an ADR approves the bundle cost.
- Do not hotlink `framerusercontent.com` assets. Use our own optimised images and videos. Check the template licence before reusing any template image, video or font.

## Step 1: tokens first (before any component)
1. Read all `tokens-*.json`. Produce `docs/design-reference/DESIGN_TOKENS.md`: colour roles (name each by role, e.g. `bg`, `surface`, `ink`, `ink-muted`, `accent`, `line`), type scale (family, size, weight, line-height, tracking, case per role at each breakpoint), spacing scale, radii, shadows, transitions, breakpoints.
2. Generate `src/styles/tokens.css` (CSS variables) and extend the Tailwind theme from it. No raw hex in components.
3. Fonts: use the families in `fontFaces`; self-host through `next/font`; verify the licence; preload only the weights used above the fold.
4. Check contrast of every text/background pair that appears (4.5:1 text, 3:1 large text and icons). Report failures to the owner with a proposed minimal adjustment; do not silently change the palette.
**Stop for owner review** of `DESIGN_TOKENS.md`.

## Step 2: the fidelity pass (template text, not SIZA text)
Pixel comparison only works when the content is the same. So first build each component with the template's **original copy**, in a dev-only route (`/dev/fidelity/<page>`, blocked in production by env check), then compare.
Loop per section component (Nav, Hero, StatCounters, ServiceSlide, Steps, ListRows, FAQ accordion, ContactForm, BlogCard, Footer, SectionLabel with the `//` and `*( )` motifs):
1. Read the section in the export and the tokens.
2. Build the component.
3. `node tools/design/visual-diff.mjs capture http://localhost:3000/dev/fidelity/home out/home-375.png 375` (repeat 768 and 1440).
4. `node tools/design/visual-diff.mjs compare docs/design-reference/extract/screens/home-375.png out/home-375.png --out out/diff --skip <slices with video or animation>`.
5. Open the diff images for slices over tolerance, fix, repeat. **Maximum 3 iterations per section**, then write down the remaining differences and ask the owner.
Tolerance: 8% per 900 px slice and 5% page-height difference by default. Skip slices that contain video, counters or carousels, and check those by eye.
Hover, focus and active states: compare by hand against the live template; record the result in the hand-off note.

## Pages with no reference (login, host app, helper app, admin, and any page the export lacks)
The template and the plugin export cover only the pages the template has (home and contact, perhaps a few more). Everything else has **no reference**: login and sign-up, onboarding, the host booking flow, the helper app and the admin. For those:
1. Compose from the template's own components and tokens (nav, buttons, inputs, selects, cards, accordion, section labels, footer, type roles). Do not invent new styles. If a needed pattern does not exist (bottom nav, stepper, table, status chip, timeline, countdown), derive it from the tokens and add it **once** to the shared component library.
2. Layout and flow come from `docs/ux/ux-blueprint.md`; UX rules from `ui-ux-pro-max` and `frontend-a11y`.
3. No pixel diff. Instead save screenshots of each screen at 375 and 1440 px to `docs/design-reference/review/<stage>/` and tick the consistency checklist: same type roles, spacing scale, radii and button and field styles as the home page; one primary action per screen; loading, empty, error and success states present; contrast checked.
4. The owner approves the screenshots (a yes or no) before the next group of screens. List the screenshot paths in your message.

## Step 3: the content pass (SIZA text)
Swap in text from `docs/copy-deck.md` only. Then re-check at 375, 768, 1440 for overflow, awkward wraps (use balanced wrapping on headings), and that page height changes stay sensible. Missing a copy-deck entry: stop and ask; do not write marketing copy yourself.

## Template leftovers to scrub (all of these appear in the live template)
- Page title and meta: "Interior Design Agency Framer Template - Interio" and its description; the Open Graph image.
- Nav items PROJECT and BLOG (SIZA nav: About us, Request a helper, Apply to be a helper, Contact, Log in).
- "PLACEHOLDER REQUESTS" subtitles; service names that do not match the services model; "These service cards are placeholders" text; stock videos that are not ours.
- Hero button wording "Become a cleaner / Request a clean": use "Apply to be a helper / Request a helper".
- Invented stats: "YEARS OF EXPERIENCE", "COMPLETED PROJECTS", "CLIENT SATISFACTION" and their taglines about interiors. Remove, or show real numbers once they exist. Never invent numbers.
- The "OUR BEST WORK / FOR HOSTS" list with New York, Los Angeles, Chicago, Miami, Austin, Malibu projects and their project pages. Replace or remove.
- "How we work" steps about discovery, 3D visuals and design. Replace with the SIZA host and helper steps.
- FAQ text and questions about interior design; the "How does the design process begin?" answer.
- Contact form selects with Amsterdam and Barcelona; "Select your project / budget". Replace with request type, suburb (from our list), and message, with a bot check.
- Blog titles and dates about interiors; "GET READY" section. Remove until we have real content.
- Footer social links to generic Instagram, Facebook, X home pages; "Create a free website with Framer" badge.
- Any template image, logo or video the licence does not allow us to keep.

## Performance and low-data rules (the template is video- and image-heavy)
Poster image first; load background video after `load`, never on data saver or reduced motion; lazy-load below the fold; modern formats (WebP/AVIF) at the sizes actually shown; reserve space to prevent layout shift; target LCP under 2.5 s on throttled 4G (video excluded), Lighthouse performance 90+ on mobile, accessibility 95+. Counter animations run only when the numbers are real, only once, and respect reduced motion.

## Accessibility upgrades the template usually lacks
One `h1` per page and a sensible heading order; landmarks (`header`, `nav`, `main`, `footer`); real `button` and `a` elements; accordion with `aria-expanded` and keyboard support; visible labels on every form field with errors tied by `aria-describedby`; focus rings; alt text for meaningful images and empty alt for decorative; link text that makes sense out of context.

## Working with smaller models
Work one section at a time. Paste the diff report into the hand-off note. Do not refactor files you were not asked to touch. When unsure, ask a specific question with your recommended default.

## Definition of done (public page)
- Fidelity pass within tolerance at 375, 768 and 1440 (or differences listed and approved).
- Content pass done from the copy deck; template leftovers list ticked.
- Contrast, keyboard and heading checks pass; Lighthouse targets met; `typecheck`, `lint`, `test` green.
- Dev-only fidelity route not reachable in production.
