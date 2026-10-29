# SIZA design tokens — extracted Framer reference

**Status:** owner-approved for the full token system on 26 October 2026, including public, host, helper, and admin surfaces. Apply the documented values; refine desktop breakpoints only from the captured 1440 px evidence.

**Evidence captured:** The home, About, Project, Blog, Contact and representative detail pages at 375 px, 768 px and 1440 px. Screenshots and raw computed-style extractions live in `extract/`.

## Intent

The reference is an editorial monochrome system: black hero and navigation surfaces, warm off-white page background, high-contrast white cards, restrained grey supporting text, thin rules, compact uppercase labels, and large low-weight display type. The system avoids gradients and decorative colour.

## Colour roles

| Role | Value | Extracted from |
|---|---|---|
| `--siza-bg` | `#f5f5f5` | body background |
| `--siza-surface` | `#ffffff` | cards, controls, rules |
| `--siza-ink` | `#000000` | headings, hero/nav background |
| `--siza-ink-strong` | `#191919` | dark supporting surface |
| `--siza-muted` | `#666666` | secondary text |
| `--siza-subtle` | `#b3b3b3` | low-emphasis labels |
| `--siza-line` | `#cccccc` | light rules |
| `--siza-line-on-dark` | `rgba(255, 255, 255, 0.2)` | hero/nav rules |
| `--siza-surface-muted` | `#f2f2f2` | neutral utility surface |
| `--siza-surface-soft` | `#e6e6e6` | secondary utility surface |

Contrast is adequate for black/white and black/off-white copy. Muted copy must remain on light surfaces; it is not a white-on-black replacement.

## Typography

| Role | Family | Weight | Mobile size / line-height | Notes |
|---|---|---:|---:|---|
| Display | Geist | 500 | 48 / 48 px | -0.03em tracking; white over dark, black over light |
| Counter display | Geist | 500 | 96 / 96 px | -0.03em tracking; real values only |
| Card title | Geist | 500 | 28 / 30.8 px | -0.03em tracking |
| Body | Geist | 400 | 16 / 24 px | muted on light backgrounds |
| Section step | Geist | 500 | 24 / 31.2 px | muted, `//Step 01` motif |
| Navigation/action | Geist | 500 | 12 / 18 px | concise, uppercase where the reference uses it |
| Fine print | Geist | 500 | 10 / 13 px | labels and copyright only |

The capture also identifies Inter as a secondary reference font, but Geist is the consistently used text face. Use locally packaged `geist`, not the reference site's remote font URLs.

## Spacing and layout

| Token | Value | Observed use |
|---|---:|---|
| `--space-1` | 3 px | compact internal rhythm |
| `--space-2` | 8 px | icon/control adjacency |
| `--space-3` | 10 px | default component gap |
| `--space-4` | 12 px | compact padding |
| `--space-5` | 16 px | hero mobile inset |
| `--space-6` | 20 px | mobile page inset |
| `--space-7` | 24 px | card padding and section gap |
| `--space-8` | 44 px | tap-target and larger internal spacing |
| `--space-9` | 48 px | section and footer rhythm |
| `--space-10` | 60 px | mobile section vertical padding |
| `--space-11` | 64 px | large control/section rhythm |
| `--space-12` | 144 px | desktop editorial separation |

At 375 px, the standard content column is 335 px: a 20 px inset. The home hero uses a 16 px inset. Sections commonly use 60 px vertical and 20 px horizontal padding. Use the 1440 px capture to tune desktop implementation while preserving the approved editorial pattern.

## Shape, borders, and elevation

| Token | Value | Use |
|---|---|---|
| `--radius-tight` | 2 px | editorial buttons/utility controls |
| `--radius-card` | 8 px | cards and media shells |
| `--radius-control` | 10 px | form controls |
| `--radius-pill` | 100 px | pills/badges only |
| `--border-strong` | `1px solid #000` | deliberate contrast boundary |
| `--border-subtle` | `1px solid #ccc` | quiet separation |
| `--shadow-control` | `inset 0 0 0 1px #000` | selected/outlined control |

## Interaction and motion

- The reference extraction reports no persistent CSS transitions; use only short opacity and transform transitions where interaction feedback needs one.
- Honour `prefers-reduced-motion`; no autoplay reference videos or remote assets are reused.
- Interactive targets should retain a 44 px minimum hit area, even where the visual treatment is compact.

## Components to derive once

- Dark sticky public navigation with compact wordmark and mobile full-screen menu.
- Large editorial hero with vertical line motif.
- Section label (`//`) and step-number pattern.
- White media/card surface with 24 px inner padding.
- Thin-rule FAQ / list rows.
- Dark footer with small navigation labels.

## Deliberate exclusions

- No reference logo, photo, video, Framer runtime markup, Interio copy, project/blog routes, or `framerusercontent.com` hotlinks may ship.
- These tokens describe styling only; public text remains in `docs/copy-deck.md` and assets remain governed by `docs/ASSET_MANIFEST.md`.

## Next review

The 375 px review preview and 375/768/1440 px extracted evidence are available in `review/` and `extract/`. The owner approved the token direction on 26 October 2026.
