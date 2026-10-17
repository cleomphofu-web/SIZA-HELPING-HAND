---
name: siza-brand-voice-and-copy
description: SIZA voice, glossary, mandatory notices, banned claims and microcopy patterns for hosts and helpers, plus the copy-lint rules. Use when writing or editing any user-facing text: pages, buttons, errors, emails, notifications, legal notices, admin messages, or marketing copy.
metadata:
  origin: SIZA
---

# SIZA Brand Voice and Copy

**Status: DRAFT voice profile.** Replace with a profile built from the owner's real writing (WhatsApp posts, TikTok captions, notes). Until then follow this.

## Where the words live (single source)
Every word on the site is a key in `docs/copy-deck.md`. `npm run build:copy` generates `src/content/copy.generated.ts`; components call `t("key", vars)`. Never type site text in a component, never edit the generated file, never copy a string into a second place. A missing key is a gap: add it to the deck (marked `[OWNER]` if you do not know the fact), do not invent the text. The build and `npm run check:structure` enforce the banned-word and old-term lists; claim text lives only in `claim.*` keys and is shown only when its switch is on.

## Voice in one line
Plain, warm, direct. Like a trusted neighbour who runs a tidy business: clear about what happens next, honest about limits, never hype.

## Rules
- Short sentences. Everyday South African English; around grade 6-8 reading level; many users read English as a second language. No jargon, no legalese in UI text.
- Say what happened, what it means for the person, and what to do next. Errors never blame the user.
- Hosts: reassuring and specific ("Your request is live. Helpers near you will see it within minutes.").
- Helpers: respectful and practical, about work and pay, never patronising.
- Numbers beat adjectives: show the price, the time, the fee.
- No exclamation marks except real celebration; no emojis in system messages; no slang that may not travel.
- Consistent words: **host**, **helper**, **request**, **assigned**, **check-in code**, **service fee**, **transport**. Do not swap in synonyms.
- Translations (isiZulu, Sesotho, Afrikaans) are a later phase; write copy so it is easy to translate: no idioms, no text in images, no concatenated sentence fragments.

## Mandatory notices (use exactly; legal text may be replaced by lawyer text)
- Outside agreements: "Agreements made outside SIZA are not SIZA's responsibility."
- Address sharing: "Your address is shared with the helper(s) assigned to you."
- Phase A payment: "Payment is arranged directly between you and the helper after the job. SIZA does not hold funds or cover payment disputes."
- Phase B payment: `{{LEGAL_TEXT_PENDING}}` (lawyer-approved description of how card payment, holding and release work).
- Public profile consent (helpers): "Your first name, photo, job title, services, areas and reviews will be visible to hosts. Your phone number and surname stay private until a job is assigned." + links to Terms and Privacy and a required checkbox.
Place notices next to the action button, not behind a link.

## Claims
Allowed only if enforced by code: "Every helper on SIZA has had their ID and selfie checked by SIZA", "references called". The "How we vet" page lists exactly the checks done and nothing more. Never state or imply: guarantee, insured, background checked, secure/escrow payment (until Phase B and lawyer-approved), "you choose your helper" (while SIZA assigns), fake counters, invented testimonials or ratings, stock photos of people presented as SIZA helpers. Real photos only with consent.

## Microcopy patterns
| Situation | Pattern | Example |
|---|---|---|
| Validation | what to fix | "Enter a cell number like 082 123 4567." |
| Job taken | explain, offer next | "Another helper accepted this job first. New jobs appear here as they come in." |
| Paywall | state fact, show price/date | "Your subscription ended on 12 Oct. Pay R___ to see new jobs." |
| Lock | explain how to clear | "Confirm your last job to request another." |
| Empty list | what to do | "No jobs in your areas right now. We'll show new ones here." |
| Error | what + reference | "Something went wrong on our side. Reference: A1B2C3. Try again in a minute." |
| Declined helper | kind, no detail that harms | "We can't approve your profile right now." + reason chosen by admin |

## Emails and WhatsApp messages
Subject states the action ("Your helper is assigned: Thandi, Sat 09:00"). One main action, one link. Include the reference and the support route. No personal data beyond what that recipient may see under the reveal rules. The WhatsApp job summary never contains the host's phone or email.

## Copy lint (automated test)
A test scans UI strings and email templates for banned patterns and fails the build:
`/guarantee|insured|background[- ]check|secure payment|escrow|100% safe|you choose/i`
and requires the mandatory notices to be present on the booking, application and how-it-works pages.

## Checklist
- [ ] Uses glossary words; no banned claim.
- [ ] Mandatory notices present and exact.
- [ ] Error text is specific, kind and actionable.
- [ ] Easy to translate; no jargon.
