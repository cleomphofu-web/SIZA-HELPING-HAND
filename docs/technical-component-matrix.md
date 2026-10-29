# Phase A technical component matrix

This matrix records the initialization audit. “Implemented” means evidence exists in the current code or configuration; it does not mean the Phase A acceptance gate is complete.

| Component | Phase A decision | Current evidence | State |
|---|---|---|---|
| Rate limiting | Required for login, signup, and mutations | `src/server/security/rate-limit.ts`, route tests | Implemented; full integration audit remains |
| Caching | In scope, lightweight Next.js caching only | No heavy cache dependency or Redis cluster | Deferred implementation |
| Load balancing / reverse proxy | Hosting concern | Vercel/hosting boundary documented | Native/hosted |
| API gateway, service discovery, Kubernetes | Out of scope | Monolithic App Router | Deferred |
| Queues, pub/sub, circuit breakers, DLQs | Out of scope | No queue infrastructure | Deferred |
| Timeouts, retries, backoff, idempotency | Required for mutations | Booking idempotency and service boundaries exist | Partial; audit per mutation |
| Connection pooling | Required | Supabase/pgBouncer boundary | Native/hosted; verify in deploy checklist |
| Indexing and query optimisation | Required | Forward migration includes Phase A indexes | Implemented; review with local/disposable tests |
| Atomic acceptance / isolation | Required | Forward migration claim function and domain tests | Implemented; concurrency verification pending |
| N+1, leaks, deadlocks | Review requirement | Code-review and verification gates | Pending review |
| Sharding, partitioning, replicas, distributed locks | Out of scope | Single Supabase instance | Deferred |
| Health checks / liveness | Required | No completed health endpoint in route inventory | Not implemented |
| Structured logging / monitoring | Required | No-PII logging policy documented | Partial; implementation pending |
| Feature flags / blue-green / canary | Out of scope | Prototype environment switch only | Deferred |
| SLOs, error budgets, chaos | Out of scope for pilot | Not planned in Phase A | Deferred |
| Secrets management | Required | `.env.example`, untracked `.env`, no secret values in docs | Implemented; verify in deploy checklist |
| JWT/session auth | Required | Supabase Auth and server policy modules | Implemented; security review pending |
| SQL injection, XSS, CSRF | Required | Zod, parameterized Supabase access, framework defaults | Partial; security tests pending |
| TLS / encryption at rest | Required | Platform boundary; ID encryption/HMAC modules | Native/implemented; verification pending |
| OAuth | Optional/configurable | Email/password is primary; no OAuth gate selected | Deferred unless owner enables |
| API versioning | Internal `/api/*` now; `/api/v1/*` future | Route inventory | Implemented policy |
| Webhooks | Lightweight future need only | No provider webhook route in Phase A inventory | Deferred unless required by email/auth provider |
| gRPC, TCP/UDP, clock-skew/network partitions | Out of scope | App Router/HTTP only | Deferred |
| IaC/Terraform/Helm | Out of scope | Hosting checklist instead | Deferred |
| Build caching / dependency audit | Required | npm scripts and audit gate documented | Partial; `npm audit` environment blocker recorded |

Testing rule: database, RLS, and concurrency checks must use local Supabase or a separate disposable project. The linked project is read-only unless explicitly authorised for a write.
