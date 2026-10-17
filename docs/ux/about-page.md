# SIZA About page: concept and build notes

**The words live in `docs/copy-deck.md` (keys `about.*`). This file explains the idea and how to build it; it does not repeat the copy.**

**Idea:** a scroll story built from the template's own parts (uppercase `//` section labels, `*( )` subtitles, big type, "Step 01" numbers, full-bleed moments). Three jobs: explain the name, show fairness as a feature, and be honest about limits. Honesty is the creative angle: most platforms hide what they do not do yet; SIZA puts it on the page.

**Rules:** no invented numbers, quotes, testimonials or founder facts. Anything in `[OWNER: ...]` or `[CONFIRM: ...]` in the deck is a fact only the owner can supply. People photos only with written consent (listed in `public/assets/CREDITS.md`); until then use type and illustration.

## Sections and the deck keys they use
| # | Section | Deck keys | Build notes |
|---|---|---|---|
| 1 | Hero: "SIZA means help." | `about.hero.*` | Giant headline, line-by-line reveal. CTAs use `button.request` and `button.apply` |
| 2 | The name: help in other languages | `about.name.*` | One word per line, revealing on scroll; put `lang="zu"`, `lang="st"`, `lang="af"` on the foreign words. Unverified lines stay flagged until a native speaker confirms |
| 3 | Two sides of one door | `about.why.*` | Two columns that meet in the middle on desktop, stacked on mobile; label as an everyday story |
| 4 | What we believe | `about.believe.1-4.*` | Reuse the template's numbered "Step" block |
| 5 | A SIZA job, start to finish | `about.job.*` | Vertical timeline, five steps with time stamps; clearly labelled as an example with made-up people |
| 6 | From Johannesburg to the Vaal | `about.where.*` | Simple region graphic with suburb chips (`about/region-map.svg`) and a notify-me button |
| 7 | What we do not do (yet) | `about.limits.*` | Calm two-column card, "Today" and "Coming" |
| 8 | The people | `about.people.*` | Founder card; hide the whole section until the owner supplies the name and story |
| 9 | Closing band | `about.cta.*` | Two big blocks, one per audience |

## Build notes
- Components (reuse, do not duplicate): `SectionLabel`, `Subtitle`, `BigStatement`, `NumberedPrinciple`, `Timeline`, `RegionMap`, `TwoColumnCard`, `CTABand`, shared Nav and Footer.
- Motion: line-by-line reveal for sections 1 and 2, subtle fade or slide elsewhere. No costly parallax; all motion off under reduced motion; no autoplay video on this page.
- Semantics: one `h1`, an `h2` per section, landmarks, meaningful alt text only where an image carries meaning.
- Meta: `seo.about.title` and `seo.about.description`.
- Publishing gate: every `[OWNER]` and `[CONFIRM]` line is resolved or the line is removed (the strict copy build enforces this).

## Questions to draw out the founder story (answer in voice notes if easier)
1. What did you see, or live through, that made you start SIZA?
2. Who is the first helper or host you thought of when you imagined it?
3. What does "fair" mean to you in this work, in one sentence?
4. What are you proudest of so far?
5. What do you want a helper to say about SIZA in a year?
6. What is one promise you will not break?
