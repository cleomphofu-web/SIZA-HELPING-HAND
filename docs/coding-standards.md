# SIZA coding-standards delta

This page is written for the `code-review` skill. The generic `coding-standards` skill remains the baseline; SIZA’s own `AGENTS.md`, architecture, API, security, frontend, testing, and product skills take precedence.

## Review deltas

- Use `helper` terminology in new code, schema names, routes, and copy.
- Keep business logic in `src/server/services`; keep route handlers thin and UI components presentation-focused.
- Keep database access in `src/server/db`; client code never imports server modules or service-role clients.
- Prefer immutable updates, descriptive names, early returns, strict Zod schemas, and typed `Result<T>` errors.
- Never trust client role, ownership, status, price, amount, or assignment state.
- Keep money as integer cents and timestamps as UTC; display Johannesburg time in UI.
- Add tests before implementation for authorization, ownership, privacy/reveal, idempotency, concurrency, state transitions, and rollback.
- Do not add dependencies, providers, migrations, or public claims without the required ADR/gate.

## Review links

- Architecture and seams: [`docs/architecture.md`](architecture.md)
- Route inventory: [`docs/api-design.md`](api-design.md)
- Detailed build sequence: [`docs/plans/siza-phase-a.md`](plans/siza-phase-a.md)
- Current milestone: [`docs/BUILD_STATUS.md`](BUILD_STATUS.md)
- Security and data rules: `siza-security-privacy`, `security-review`, `santa-method`
- Testing and verification: `siza-testing-tdd`, `verification-loop`
