# Asset manifest and image rules

Put your files in `public/assets/images/<folder>/` (videos in `public/assets/videos/`) using the file names below. The site reads this manifest: a missing file shows a clearly labelled placeholder in development and **fails `npm run check:assets` in CI** if a published page still uses it, unless the owner marks the slot `placeholder-ok`.

## Rules
- **Do not use the template's own images, logos or videos** unless the licence allows it (owner confirms). Do not use Interio branding.
- **No stock or placeholder photos of people** presented as SIZA helpers or hosts. People photos only with written consent, listed in `public/assets/CREDITS.md`.
- Property, interior and cleaning-supplies photos (no faces) are fine if you own them or the licence allows commercial use. Unsplash or similar: only if the owner approves each image; download it (never hotlink), keep it in this folder, and record author, URL and licence in `public/assets/CREDITS.md`. The agent may propose candidates in `docs/design-reference/asset-suggestions.md` (URL, licence, why) but must not download them without approval.
- Formats: photos WebP (AVIF optional) at the stated size; hero up to 200 KB, cards up to 120 KB; logos and illustrations SVG (optimised); video MP4 (H.264, muted, 6 to 8 s loop, 720p, up to 2 MB) with a poster image.
- File names: lowercase, hyphens, no spaces. Every image needs alt text (below); decorative images use empty alt.
- Keep phone data costs in mind: do not add more or bigger images than the slots below.

## Slots
| Slot id | File | Used on | Size / ratio | Subject guidance | Alt text | Status |
|---|---|---|---|---|---|---|
| logo.wordmark.dark | logos/siza-wordmark-dark.svg | header, footer (light backgrounds) | SVG | SIZA wordmark in dark ink | SIZA | needed |
| logo.wordmark.light | logos/siza-wordmark-light.svg | header, footer (dark backgrounds) | SVG | SIZA wordmark in light ink | SIZA | needed |
| logo.favicon | logos/favicon.svg + favicon-32.png, apple-touch-icon-180.png, icon-512.png | browser, home screen | SVG + PNG | simplified mark | (none) | needed |
| og.default | og/og-default.webp | link previews | 1200x630 | wordmark + one strong line | SIZA: help, made fair | needed |
| hero.home.host | hero/home-host.webp | Home hero (host side) | 1600x1000 (16:10) | bright, tidy modern living room or kitchen, no people | A tidy, light-filled living room | needed |
| hero.home.helper | hero/home-helper.webp | Home hero (helper side) | 1600x1000 | consented photo of a helper at work, or cleaning supplies and a neat room, no faces | A cleaning caddy in a bright room | needed |
| hero.video | videos/hero-loop.mp4 + hero/hero-poster.webp | Home hero (optional) | 720p, <=2 MB | slow loop of a room being refreshed, no people | (decorative) | optional |
| service.home-cleaning | services/home-cleaning.webp (+ videos/home-cleaning.mp4) | service cards | 1200x1500 (4:5) | clean kitchen or bathroom | Freshly cleaned kitchen | needed |
| service.airbnb-turnover | services/airbnb-turnover.webp | service cards | 1200x1500 | made bed, fresh linen, guest-ready | A guest-ready bedroom | needed |
| service.office | services/office.webp | service cards | 1200x1500 | tidy open-plan office | A clean, tidy office | needed |
| service.garden | services/garden.webp | service cards | 1200x1500 | neat garden, lawn | A neat garden | needed |
| service.handyman | services/handyman.webp | service cards | 1200x1500 | tools on a bench, no people | A set of hand tools | needed |
| service.custom | services/custom.webp | service cards | 1200x1500 | open door, light | An open door with light | needed |
| how.step-1..4 | how-it-works/step-1.webp ... step-4.webp | How it works | match the template ratios in the extract | simple scenes or illustrations | per step | needed |
| about.region-map | about/region-map.svg | About page | SVG | Johannesburg and Vaal areas, suburb chips | Map of areas SIZA serves | needed |
| about.founder | about/founder.webp | About page | 1000x1250 (4:5) | consented photo of the founder | [Founder name] | needed (owner) |
| helpers.avatar | helpers/avatar-placeholder.svg | profiles with no photo | SVG | neutral illustration, not a stock face | (decorative) | needed |
| illus.empty-jobs, illus.empty-requests, illus.error, illus.not-found | illustrations/*.svg | empty and error states | SVG | simple line illustrations in the template style | (decorative) | needed |
| apply.hero | hero/apply.webp | Apply page | 1600x1000 | consented helper photo, or illustration | A helper preparing for a job | optional |
| hero.home.background | hero/background home page hero.png | Home hero | owner supplied PNG | Home interior background | Decorative | supplied by owner |
| hero.home.wordmark | hero/Marshmallow home page hero.png | Home hero | owner supplied PNG | SIZA wordmark treatment | Decorative | supplied by owner |
| hero.public.about | hero/public/about-room.jpg | About hero | local Unsplash download | Empty light-filled room, no people | Decorative | supplied — credit recorded |
| hero.public.services | hero/public/services-home.jpg | Legacy Services route; no current page | local Unsplash download | Residential exterior, no people | Decorative | retained, unused |
| hero.public.how | hero/public/how-home.jpg | Legacy How it works route; no current page | local Unsplash download | Home room, no people | Decorative | retained, unused |
| hero.public.contact | hero/public/contact-room.jpg | Contact hero | local Unsplash download | Home room, no people | Decorative | supplied — credit recorded |
| hero.public.legacy | hero/Service hero.png | No current route | owner supplied PNG | Previously shared public backdrop | Decorative | retained, unused |
| heading.about | og/Carved Wooden ABOUT Typography.png | About below-hero heading | owner supplied PNG | Carved ABOUT lettering | Decorative | supplied by owner |
| heading.services | og/Carved Wooden Service Letters.png | Home Services section heading | owner supplied PNG | Carved SERVICES lettering | Decorative | supplied by owner |
| heading.how | og/How It Works in Carved Wood.png | Home How it works section heading | owner supplied PNG | Carved HOW IT WORKS lettering | Decorative | supplied by owner |
| heading.request | og/Rustic Wooden Request Typography.png | Request below-hero heading | owner supplied PNG | Carved REQUEST lettering | Decorative | supplied by owner |
| heading.apply | og/Carved Wooden APPLY Letters.png | Apply below-hero heading | owner supplied PNG | Carved APPLY lettering | Decorative | supplied by owner |
| heading.contact | og/Carved Wooden CONTACT Typography.png | Contact below-hero heading | owner supplied PNG | Carved CONTACT lettering | Decorative | supplied by owner |
