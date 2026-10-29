# Server libraries

- Treat this directory as server-only unless a file is explicitly safe for the browser.
- Never log secrets, ID numbers, document paths, tokens, or full request bodies.
- Validate at trust boundaries and fail closed when security services are unavailable.
