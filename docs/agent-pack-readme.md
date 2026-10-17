# SIZA agent pack

What is in it (everything is meant to sit at the **repo root**):
- `AGENTS.md`: the rules every coding session starts from (terminology, one-home-for-everything table, skill router, working with the owner).
- `.claude/skills/siza-*/SKILL.md`: SIZA's own skills. Third-party skills are added by `node tools/install-external-skills.mjs` (pinned versions; see `docs/EXTERNAL_SKILLS.md`).
- `docs/`: the spec, UX blueprint, About page notes, copy deck, rate card draft, costs, asset manifest, phase plan, and empty folders the agent fills (`design-reference/`, `adr/`, `archive/`, `realign/`).
- `tools/`: `bootstrap.mjs` (one-command setup), `install-external-skills.mjs`, `content/build-copy.mjs` (copy deck to code), `quality/check-structure.mjs` (old terms, duplicates), `design/` (Framer extraction and visual diff).
- `public/assets/`: image and video folders; the list of images to supply is `docs/ASSET_MANIFEST.md`.

## Install
Do not leave the pack in a sub-folder. The coding agent does the merge (see `codex-prompt-realign.md`, section 3). By hand: copy the contents of this folder into the repo root, then run `node tools/bootstrap.mjs` and `node tools/install-external-skills.mjs --with-later`.

## Keep it healthy
- When the spec changes, update the matching skill and the copy deck in the same change. The spec wins on conflict.
- Skills describe how to build; they are not legal advice. Legal text comes from your lawyer and sits as `{{LEGAL_TEXT_PENDING}}` until then.
- Site text is only in `docs/copy-deck.md`; the voice profile in `siza-brand-voice-and-copy` is a draft until real writing samples are added.

## Stack note
Next.js (App Router) + TypeScript + Tailwind + Supabase, as in the spec. If the frontend moves to Angular, replace only `siza-frontend` and the Next.js parts of `siza-architecture`.
