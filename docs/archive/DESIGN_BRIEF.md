SUPERSEDED by docs/SIZA-v2-spec.md and docs/copy-deck.md. Do not follow.

# SIZA Design Brief

_Draft — documentation only; no application code is included._

## Purpose

SIZA is a Johannesburg-first cleaning marketplace. The public experience should feel premium, editorial, and design-led while making the launch proposition immediately clear: hosts can request vetted, ID- and selfie-checked cleaners for their property, and payment is arranged directly with the cleaner after the job.

## Launch audience and five-second message

Within five seconds on a phone, a host arriving from TikTok must understand:

1. SIZA connects them with vetted, ID- and selfie-checked cleaners for their property, bookable in minutes.
2. The primary action is **Request a clean**.

Only claims that are true at launch may appear.

## Visual direction

- Tone: premium, editorial, design-led.
- Balance: typography leads, supported by purposeful imagery of properties and, only where consent exists, real SIZA cleaners.
- Never use stock photos of people presented as SIZA cleaners. Use real cleaner photos only with the cleaner’s consent; otherwise use property imagery or illustration.
- Hero supporting line: **Vetted, ID- and selfie-checked cleaners for your property.**
- Hero CTA: **Request a clean**.
- Use the supplied SIZA assets exactly; do not redraw, recolour, or invent the logo.
- Preserve the locked palette, typography constraints, contrast requirements, no-gradient rule, and custom-component direction from the source specification.
- Use the logo’s two-line motif for restrained progress motion and occasional Z-angle transitions. Animate only transform and opacity, respect reduced motion, and keep the landing page fast on a mid-range phone over 4G.

## Trust and content truth

“Vetted” means the full admin checklist was completed for that cleaner: the ID matches the selfie, the ID is readable, and both references were phoned. Only approved cleaners may be shown or assigned. Every trust claim must be backed by the corresponding completed check for every cleaner shown.

At launch, SIZA may show only these trust signals:

- “ID and selfie checked by SIZA” — never imply Home Affairs verification.
- “References called”, because approval requires both references to have been phoned.
- Cleaner first name, photo, suburbs, services, and self-reported experience.
- A clear explanation that cleaners set their own rates.
- “Now onboarding our first cleaners in Johannesburg” or equivalent, while accurate.

Do not show reviews, insurance, guarantees, or secure-payment claims at launch.

### How we vet

The public site should include a short explainer listing exactly these checks:

1. SIZA checks that the ID matches the applicant’s selfie.
2. SIZA checks that the ID document is readable.
3. SIZA phones both supplied references.

Do not imply Home Affairs verification, background checks, government verification, insurance, or any additional screening.

## Payment disclosure

Use the full disclosure in How it works and an equivalent note in the cleaner application:

> At launch, payment is arranged directly between you and the cleaner after the job. SIZA does not hold funds or cover payment disputes.

Show this short version beside the booking submit button: “Payment is arranged directly with your cleaner after the job. SIZA does not hold funds or cover payment disputes.” The wording must not imply payment protection, escrow, or SIZA-held funds.

## Cleaner application

The application should feel human and reassuring. It should explain each step, reduce applicant anxiety, and make the screening process understandable without overstating what SIZA verifies. The application should communicate the direct-payment arrangement and that cleaners set their own rates.

## Admin experience

The launch admin experience must make these tasks fast:

1. Review and approve cleaner applications. Show identity and document evidence on the same screen. Require the checklist “ID matches selfie”, “ID readable”, and “both references called” before Approve unlocks.
2. Match cleaners to booking requests using a suburb-and-service shortlist, one-tap assign, and a WhatsApp-ready job summary.
3. Monitor booking and job status, flagging unassigned bookings close to their start time.

People records should include a simple **Message on WhatsApp** action. Payments, pricing management, and metrics are out of scope for launch.

## Locked source decisions

The source specification’s locked brand, palette, typography, hero-video behavior, accessibility, performance, component, and distinctiveness requirements remain in force. The landing page must have two distinct written layout-and-motion directions with rough sketches presented for selection before implementation.

### Implementation update

The current public-site implementation uses the subsequently approved Framer-driven monochrome direction. It retains the launch trust, privacy, payment and accessibility requirements in this brief; the earlier yellow/green visual direction is no longer the active public UI direction. Placeholder media remains in place until approved SIZA property imagery, consented cleaner photography and optional video are supplied.

## Reference principles

Use the reference sites for principles only; do not copy their layouts or assets:

- [Fume Studio](https://fume-studio.com/): study editorial typography, confident composition, and controlled art direction.
- [Tekt](https://tekt.com.au/): study disciplined spacing, hierarchy, and how information is staged across the page.
- [Nossara](https://nossara.com/): study premium restraint, typography-led pacing, and purposeful transitions.
- [Congrue](https://www.congrue.ai/): study considered motion, clear product storytelling, and expressive type without generic sections.
- [Viewport](https://viewport.theresonance.studio/) is a negative reference: avoid its visual qualities or interactions that feel unsuitable for SIZA’s clarity, trust, and mobile-first launch.

## Conflicts requiring confirmation

No direct conflict remains between the interview decisions and the source documents on trust claims, payment disclosure, admin scope, or the definition of “vetted”. The brief now follows section 9c: both references must be called, the payment wording is fixed, and clients do not choose cleaners.

One product-copy decision remains open: the proposed headline **“Guest-ready, between every stay.”** is appropriate if Airbnb hosts are the launch focus, but the source scope also includes homes and offices. Please confirm whether Airbnb hosts are the primary launch audience or whether the hero should use a broader headline.

## Still needed for approval

- Confirm whether Airbnb hosts are the launch focus before using “Guest-ready, between every stay.”; otherwise provide or approve a broader hero headline.
- Choose the open-source body font to pair with Archivo, or approve selecting one during implementation subject to the brief’s readability and licensing constraints.
- Confirm the exact visual assets and font files when implementation begins.

## Approval gate

This is a design brief draft only. No application code, schema, implementation, or landing-page direction has been created. Resolve the remaining headline and body-font choices, then approve this brief before implementation begins.
