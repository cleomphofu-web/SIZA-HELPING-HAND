# Public hero system

**Status:** owner-approved direction — 17 October 2026.

## Scope

- Home: place `Marshmallow home page hero.png` over `background home page hero.png` beneath a dark public header.
- Public information pages: About, Services, How it works, and Contact use their own low-opacity, locally downloaded no-people backdrop with one large white route word. `Service hero.png` is not rendered by a public route.
- Each information page places its supplied carved-wood word image immediately below the hero in a fixed 212px-high frame, centred within a maximum width of 880px. The image is decorative; an equivalent semantic heading remains in the document for assistive technology and search.
- `/request` and `/apply` are redirect-only hand-offs to role-specific sign-up; they do not render a public hero or carved-wood section.

## Boundaries

- No forms, account flows, database calls, or new public claims in this batch.
- Host, helper, and admin surfaces do not use this treatment.
- Existing supplied assets remain owner-provided source files. They are rendered through `next/image`; no remote or template asset is used.

## Acceptance criteria

- At 375 px, the hero image is fully contained, readable, and has no horizontal scrolling.
- The public header, hero and heading images have meaningful landmarks and keyboard links.
- Hero route text has readable white contrast over its darkened backdrop.
- All display words have real copy-deck text available to screen readers.
