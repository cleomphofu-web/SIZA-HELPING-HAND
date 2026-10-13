# SIZA project instructions

## Zero-Cost Development Rules

- Do not require external paid SaaS integrations or paid external APIs.
- Use standard Next.js, Tailwind CSS, and Shadcn UI or other free and open-source components.
- Follow clean TypeScript, modular code, and small focused components.
- Keep secrets out of source control. Preserve the existing `.env` and `.gitignore` protections.
- Keep server-side authorization, private data handling, and API validation explicit and secure.

## UI Iteration Workflow

- UI layouts will be described in plain text or pasted as Markdown and wireframes.
- Build UI components with free Tailwind CSS and standard React code.
- Preserve SIZA’s approved visual direction, accessibility requirements, responsive behaviour, and South African English copy.
- Use accessible native semantics, visible focus states, keyboard support, labels, and clear form errors.
- Do not introduce paid visual builders, hosted design systems, proprietary UI services, or external runtime dependencies without approval.

## Project priorities

Priorities are security, API correctness, distinctive design, then delivery speed. Keep Supabase Storage private, enforce admin authorization server-side, and use only launch-approved trust claims. “Vetted” means the complete approval checklist passed.

Cloudflare Turnstile cannot be configured until SIZA has a domain. Keep that integration configurable and do not commit temporary secrets or pretend production verification is available.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
