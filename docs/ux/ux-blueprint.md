# SIZA UX Blueprint (v1 draft for owner review)

Built with the ui-ux-pro-max skill (searched for product pattern, navigation, forms, loading, typography and accessibility rules) plus SIZA's own spec. The skill's auto-generated palette was blue/orange, which does not fit SIZA, so it was discarded: **the Framer template's palette and fonts (extracted to `docs/design-reference/`) win.** What I kept from the skill: a "trust + conversion" page pattern (transparent pricing, low-friction forms), flat visual style, bottom navigation of at most 5 items, step indicators on multi-step flows, skeletons instead of long spinners, 44-48 px touch targets, labels always visible, errors next to the field with a recovery action, undo and confirmation for destructive actions, tabular numbers for prices and timers, vector icons (no emoji icons).

## 0. Things to settle first
1. **The Framer page was not attached to this chat**, so I have not seen it. To hand it to the agent, give: the live Framer URL, desktop and mobile screenshots of every section, a list of animations, and the fonts and colours used. As far as I know Framer does not export clean code, so the agent will rebuild the page in Next.js from those references. Check the template's licence allows reuse outside Framer, and remove the previous owner's text and images.
2. **Word choice: "helper".** The UI says helper; older documents say cleaner. In code, database and copy use `helper`. (Added to `AGENTS.md`.)
3. **More services than cleaning.** Your fast picks (home cleaning, office cleaning, handyman, garden, custom) are bigger than the pilot plan. Recommendation in section 9.
4. **Phase A has no card payment.** The "payments" screen after a helper accepts shows how payment works now (pay the helper directly after the job) and becomes card checkout in Phase B. Same position in the flow, different content.

## 1. Four surfaces, one codebase
| Surface | Who | Feel | Navigation |
|---|---|---|---|
| Public site | everyone | loud, clear, trustworthy | top nav: **About us, Request a helper, Apply to be a helper, Contact**, plus Log in |
| Host app | people who book | fast, calm, one thumb | floating bottom nav: **Home, Services, Activity, Account** (side rail on desktop) |
| Helper app | approved workers | simple, work-first, low data | bottom nav: **Jobs, My jobs, Plan, Account** |
| Admin | you | dense, desktop-first | left sidebar: Overview, Helpers, Bookings, Reports, Payments, Settings, Audit log |

Routes (Next.js route groups): `(public)`, `/app/...` for hosts, `/helper/...` for helpers, `/admin/...`. A person has one role. "Request a helper" starts host sign-up; "Apply to be a helper" starts helper sign-up.

## 2. Public site
### Common
Sticky top nav (logo, the four links, Log in). Mobile: a menu button that opens a full-screen list, with the main CTA always visible. Footer: links, contact, Terms, Privacy, areas served.
### Home `/`
1. **Hero** with an audience switch: "I need help" / "I want work". Host side shows a big **Request a helper** button; helper side shows **Apply to be a helper**. Headline options (claim-safe, pick one):
   - "Need a hand? A helper is on the way."
   - "Home help, when you need it. Work, when you want it."
   - "Real help from real people, near you."
2. **How it works for hosts** (3 steps): Tell us what you need; We find a helper near you; Check in with your code and get it done.
3. **Fast picks** (the same cards as in the app): Home cleaning, Airbnb turnover, Office cleaning, Garden, Handyman, Custom.
4. **Why SIZA**: only true claims: price you can see up front; your address stays private until a helper is assigned; a check-in code proves the right person arrived; jobs go to helpers fairly. Add "ID and selfie checked by SIZA" only when the Approve button enforces it.
5. **For helpers** block: what you earn on a typical job (from the rate card), transport included, you keep all of your pay, first job free then R100 a month.
6. **Real people**: helpers' photos and first names only with their written consent. Until you have real ones, use no people photos (type or illustration).
7. **Proof**: a live counter of completed jobs only once it is real; no invented numbers.
8. **FAQ** (12 questions: price, safety, what if no helper shows up, cancelling, what a helper may and may not do, areas, how payment works now, how to become a helper, subscription, reports, privacy, contact).
9. **Final call to action** for both audiences.
### About us `/about`
Why SIZA exists (your story, in your words), what the name means (if SIZA means "help" in isiZulu, as I believe, say so), who is behind it (real names and photo), values (fair pay, safety, respect), how it works, where it operates. You supply the story; I will draft it from your notes.
### Request a helper `/request`
A short page that explains the three steps and sends the person into sign-up (`/signup?role=host`). Returning visitors who are signed in go straight to the host Home.
### Apply to be a helper `/apply`
What helpers earn; requirements checklist (South African ID, a clear selfie, a cell number, one reference, 18 or older); what happens after applying (we review and call you; the owner sets the timeline); the R100 plan explained plainly; **Start application** button.
### Contact `/contact`
Form (name, email or phone, topic, message) protected by a bot check; WhatsApp button; support email (sizahelpinghand@gmail.com for now); hours and response promise; a "report a safety problem" shortcut.
### Copy and design rules
Plain, warm, direct (see `siza-brand-voice-and-copy`). Short sentences, no jargon, readable on a cheap phone in sunlight. Big type, high contrast, few words per screen. Language switch (isiZulu, Sesotho, Afrikaans) is planned for later; write copy so it translates easily.

## 3. Host app
### Flow
```
Request a helper → Sign up / Log in → Onboarding → Home
  → Book a helper | Book a team | Fast pick → Service form → Review → Finding your helper
  → Helper found → (Payment) → Job day → Confirm done → Activity
```
**Sign up / log in.** Options: Google, email link, email + password. Phone number is collected in onboarding, not at sign-up. **Stay signed in:** hosts stay signed in on that device for a long time (30 to 90 days, refreshed on use) so they never see the login screen on a normal return. Sensitive actions (change phone, delete account, change payment method) ask them to confirm again. "Sign out of all devices" lives in Account. Admin sessions are short.
**Onboarding** (3 short steps with a progress bar, skippable where possible): 1) your name and cell number; 2) your address and suburb (saved, never retyped), plus access notes (gate code, dog, parking); 3) agree to Terms and Privacy (linked, version stored). Result: straight to Home.
### Home (the main booking screen)
```
┌──────────────────────────────┐
│ Hi Thandi 👋 (no emoji in app)│  <- first name
│ Where: 12 Oak St, Sandton ▾  │  <- saved address, tap to change
│ ┌──────────────────────────┐ │
│ │  Book a helper           │ │  <- primary (template accent)
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │  Book a team             │ │  <- secondary, outlined
│ └──────────────────────────┘ │
│ Fast picks                   │
│ [Home cleaning] [Office]     │
│ [Garden] [Handyman] [Custom] │
│ Active job card (if any)     │
└───────[Home][Services][Activity][Account]──┘
```
- **Book a helper** = one helper. **Book a team** = 2 to 6 helpers at once (a team-size stepper); both use the same booking engine (`cleaners_needed`).
- **Fast picks** open a service page. Each service page asks only what that service needs, then goes to Review.
### Service pages (examples)
- **Home cleaning:** type (standard, deep, Airbnb turnover), bedrooms, bathrooms, add-ons (oven, fridge, windows, laundry, ironing, balcony), date and time, access notes. Price shown live from the rate card.
- **Office cleaning:** floor area or rooms, frequency (once-off or weekly later), after-hours access, date and time. (Price mode in section 9.)
- **Garden:** tasks (mowing, trimming, weeding, rubbish removal), area size, equipment available on site (yes or no), date and time.
- **Handyman:** pick from a safe task list (assembly, hanging, minor repairs, painting touch-ups, moving small items) and describe it. **Excluded and stated on screen:** electrical, plumbing, gas, roofing and structural work.
- **Custom service:** a free-text request, reviewed by SIZA before helpers see it.
Each service page ends with the same footer: when, how many helpers, pay per helper and transport (guide shown, host can raise it), access notes, the three notices, **Review request**.
### Review screen
One summary: service, address (masked until assigned), time, helpers, pay per helper, transport, total, cancellation rule, the notices, **Confirm request**. Edits go back without losing input.
### Finding your helper
Not a spinner. A status screen with a stable layout: "Looking for a helper near you", a countdown for the first offer window ("offered to 3 helpers first"), what happens next, a cancel link. Updates by email now and by push notification once added. If nobody accepts in the window it opens to all eligible helpers and the screen says so. If still nobody: **No helper yet** with three actions: raise pay or transport, widen the time window, or try later. Requests expire at 48 hours or the start time.
### Helper found
The helper's profile card (first name, photo, services, areas, jobs completed; reviews arrive in Phase B), the **check-in code** (large, copyable, readable aloud), a WhatsApp button to message them, cancellation rules, and next steps. Free cancel before payment (Phase B) or before the helper arrives.
### Payment step
Position: right after the helper is found, as you described.
- **Phase A:** a clear card: "You pay your helper directly after the job. SIZA does not hold funds or cover payment disputes." with the agreed amount.
- **Phase B:** card checkout, price breakdown with the service fee shown on top, receipt, and "held until the job is done".
### Job day
A simple timeline: Assigned, Helper has arrived (check-in code accepted), In progress, Finished. A "Something wrong?" button on every step opens the report form.
### Finish
Confirm the job is done. Phase B adds rating and comment. Confirming unlocks new requests (confirmation lock).
### Floating bottom navigation
- Four items with icon **and** label: **Home, Services, Activity, Account**. Floating pill with side margins, 64 px high plus the phone's safe area, 48 px touch targets.
- Active item uses the template's accent fill with a contrasting icon; Activity shows a dot when a job is active.
- Hidden on the booking, review and checkout steps (focus mode) and while the keyboard is open; page content has bottom padding so nothing is covered.
- Desktop: becomes a left rail or top bar.
- Tabs: **Home** (booking), **Services** (full list, search, "coming soon" cards with a notify-me button), **Activity** (upcoming, active, past; **Book again**), **Account**.
### Account
Profile and saved addresses, notifications, payment methods (Phase B), language (later), Terms and conditions, Privacy policy, help and contact, report a problem, safety tips, sign out, sign out of all devices, delete account (with a clear explanation of what is kept). Later: refer a friend, favourite helpers (note: favourites clash with fair rotation, so only as a "request again" option).

## 4. Helper app
### Apply and onboarding
`/apply` → sign up → profile (first name, surname private, selfie, job titles and services, suburbs, bio) → documents (ID photo, selfie with ID, ID number, reference) with a "what we do with this and when we delete it" note → consent to the public profile → submit. A progress bar and save-and-continue. **Pending screen:** what we are checking, the expected time, who to contact; they cannot see jobs yet.
### After approval
- **Jobs:** offered jobs first, marked "Offered to you first, 8:12 left", then the rest. Each card: service, suburb, transport, pay, date and hours. Accept is a single large button; the server confirms and shows "already taken" kindly if lost.
- **Job detail:** everything except the address; the pay breakdown "you receive R___ (pay + transport)".
- **My jobs:** upcoming, in progress, done. After assignment: address, host phone, WhatsApp button, **Check in** (enter the host's code), **Finish job**.
- **Plan:** subscription status and days left; "First job free"; how to pay R100 (EFT details with their unique reference, plus "send us your payment so we can mark it"); history; reminder settings.
- **Account:** profile preview (exactly what hosts see), availability toggle ("I'm available for jobs", no penalty for turning it off), areas and services, documents status, Terms, Privacy, help, sign out.
### Principles
Low data (small images, no autoplay), big buttons, plain words, works on a cheap Android in sunlight, never shame a helper for declining or being unavailable.

## 5. Admin
Desktop-first sidebar, usable on a phone for urgent items. **Overview** (counts, open requests, helpers per suburb, jobs per helper, database size). **Helpers** (queue, detail with documents, checklist, approve or decline, duplicate flag, suspend). **Bookings** (list, urgent flags, re-offer, manual assign). **Reports** (queue and resolve). **Payments** (mark subscription payments after money has cleared in the bank). **Settings** (rate card, suburbs and zones, service categories on or off, config numbers). **Audit log**.

## 6. Cross-cutting UX
- **Four states on every screen:** loading (skeleton), empty (what to do next), error (what happened, what to do, retry), success (clear confirmation).
- **Notifications now:** email and in-app banners. **Cheap upgrade:** make the site installable (a PWA, so it adds to the home screen and can send web push). WhatsApp notifications cost money and need an approved business account; decide later.
- **Trust cues in the right place:** address privacy, check-in code, "we never ask for money outside the app", helper profile, report button. Only claims the code enforces.
- **Safety:** report button on every active job; a safety page; an in-app emergency note ("If you feel unsafe, leave and call SAPS or your security company") shown at check-in. Owner to confirm wording.
- **Language and reading level:** simple English now, grade 6-8; translation-friendly.
- **Accessibility:** contrast 4.5:1 for text and 3:1 for icons and borders, **checked on the template's actual colours** (any failing pair gets a minimal adjustment, agreed with you), visible focus, labels not placeholders, error summary, large touch targets, reduced motion.
- **Performance:** mobile first at 375 px; skeletons; compressed images; no heavy libraries.
- **Deep links:** every job and request has a URL, so emails and WhatsApp links open the right screen.

## 7. Design direction (tokens to confirm in the design brief)
Flat, high-contrast, friendly. Palette, fonts, spacing, radii and motion come from the Framer template, extracted into `docs/design-reference/DESIGN_TOKENS.md` and `src/styles/tokens.css`; status colours (green/amber/red) are added with icon plus text. Tabular numbers for prices and timers. Lucide icons (one style, filled for active). The template's editorial motifs (`//` labels, `*( )` subtitles, uppercase section labels, step numbers) stay on the public site; app screens use the same tokens with plainer layouts. About page concept: `SIZA-about-page.md`. Motion: short, transform and opacity only, off under reduced motion. Dark mode later.

## 8. Screen inventory (for the build plan)
Public: Home, About, Request a helper, Apply, Contact, Privacy, Terms, FAQ, 404. Host: Sign-up, Log-in, Onboarding x3, Home, Services, Service page x6, Review, Finding, No helper yet, Helper found, Payment (A and B), Job day, Finish, Activity list and detail, Account and sub-pages, Report. Helper: Apply flow x4, Pending, Jobs, Job detail, My jobs, Job day (check-in, finish), Plan, Account. Admin: Overview, Helpers, Helper detail, Bookings, Booking detail, Reports, Payments, Settings x3, Audit log.

## 9. Decisions for you (with my recommendation)
1. **Services at launch.** Recommend: enable Home cleaning (including Airbnb turnover) first, since the rate card, minutes and pricing exist. Show Office, Garden, Handyman and Custom as **"coming soon" cards with a notify-me button**; this collects real demand at almost no cost and avoids adding unverified helpers. Turn each on only when a suburb has at least 3 approved helpers for it.
2. **Pricing mode per service.** Add `pricing = rate_card | host_budget | quote`. Home cleaning uses the rate card. Garden and Handyman can use **host budget** (SIZA shows a guide, host sets the pay). Office and Custom start as **host budget with admin review**, moving to quotes later.
3. **Handyman scope.** Exclude electrical, plumbing, gas, roofing and structural work until licence checks exist.
4. **Custom service moderation.** Admin reviews each custom request before helpers see it.
5. **Helper types.** Each service needs helpers approved for it (their own check and, for trades, licence numbers later).
6. **Team size cap.** Recommend 2 to 6 helpers.
7. **Stay-signed-in length.** Recommend 90 days for hosts, 30 days for helpers, short for admin.
8. **Real photos:** you will need consented helper photos and a few real job photos for the site.

## 10. What I need from you
Your UX feelings (3 to 5 apps you like and why, 3 words for the feel, where it is used, what to avoid), the Framer link or screenshots, your story for About us, and your answers to section 9. Then I will turn this into `DESIGN_BRIEF.md`, `copy-deck.md` and the screen-by-screen acceptance docs the build plan requires.
