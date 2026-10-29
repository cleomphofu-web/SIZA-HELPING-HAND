# SIZA architecture — realignment foundation

**Status:** Phase A implementation authorized by the owner on 18 October 2026. The owner approved the full design-token direction on 26 October 2026.

**Build control:** the detailed sequence is [`docs/plans/siza-phase-a.md`](plans/siza-phase-a.md); the current milestone is [`docs/BUILD_STATUS.md`](BUILD_STATUS.md); risky operations are recorded in [`docs/ops-log.md`](ops-log.md).

## Phase A scope

- Accounts, role profiles and consent records.
- Host onboarding, request creation and host request views.
- Helper onboarding, private document intake and admin approval/decline/suspension.
- Fair rotation, offer visibility and atomic first-accept assignment.
- Assignment reveal rules, check-in code and no-show handling.
- Reports, confirmation locks and admin overview basics.
- Helper's first completed job is free; after it, a prepaid helper subscription is paid directly to SIZA and eligibility is enforced server-side. Phase A does not hold host funds or implement payouts.
- Keep the public holding and approved public hero pages intact.

## Out of scope for Phase A

- Host card checkout, payment holding, refunds, ledger, payouts, automatic subscription debit orders, reviews, tips, chat, maps, SMS and automation. The helper's one-off prepaid subscription after their first completed job remains in Phase A.
- Any change to the already-applied `supabase/migrations/0001_init.sql`.
- New legal wording or claims. Legal copy remains `{{LEGAL_TEXT_PENDING}}` or owner-supplied.

## Folder boundaries

```text
src/
  app/
    (public)/          holding page and legal placeholders
    (host)/app/...     host app, plus `/signup` and `/login`
    (helper)/helper/... helper app
    (admin)/admin/...  admin surface
    api/...            route handlers
  components/          UI-only shared components
  lib/                 browser-safe pure utilities
  server/              server-only services and integrations (`import "server-only"`)
    db/                Supabase clients
    services/          stable interfaces and real business-service implementations
      mock/            discard-only mock implementations for local prototypes
    policies/          role and ownership checks
    views/             redacted response builders
    config/            application configuration readers
  payments/          Phase A interface stub only; no money implementation
    security/          crypto, rate limit, Turnstile, uploads
    email/             mail integration
  styles/              generated token stylesheet
  content/             generated copy only
```

`supabase/`, `tests/`, `scripts/`, `tools/`, `docs/`, and `public/` remain at the repository root. The already-applied `supabase/migrations/0001_init.sql` remains unchanged. `0002_helper_terminology.sql` is a forward-only terminology migration and is not executed by this cleanup.

## Request and prototype safety

```text
Browser → page or route handler → prototype switch → rate limit → bot check
  → input validation → authorisation → server service → database
```

When `ALLOW_PROTOTYPE_ROUTES` is not exactly `true`, app, helper, and admin pages plus every API route and server action return 404 before data handling. `/signup` and `/login` remain resolvable so public hand-off routes do not end in a broken link, but show only the generated non-collecting holding notice; their forms appear only when the switch is explicitly enabled. The shared guard at the top of every API route and server action still fails closed before rate limiting, validation, database, storage, email, or external calls. Tests cover the proxy decisions and direct guard use, so a route cannot become live by bypassing the proxy.

## Mock service layer

`src/server/services/mock/` contains typed, discard-only services for prototype screens. `src/server/services/` remains the stable service interface consumed by route handlers and server actions. The environment-selecting service factory chooses the mock implementation while the prototype switch is off; real implementations sit behind the same interface and are selected only when the prototype switch allows real flows. Tests exercise both factory choices. No mock stores personal data or calls external services.

## Phase A service boundaries

Every Phase A mutation is a server action or route handler that calls one service under `src/server/services/`. The service accepts typed input, re-checks role and ownership through `src/server/policies/`, applies the state machine or atomic database function, and returns a typed `Result`. UI code never imports a database client or service-role key.

`src/server/services/mock/` may provide discard-only implementations for local prototype screens. A real service replaces the mock behind the same interface; switching implementations must not change authorization, validation, redaction, idempotency, or state transitions.

### Host request estimate

The host request form reads safe rate-card and suburb availability through `src/server/views/booking-form-read.ts`. It exposes only enabled service choices and areas with at least three approved helpers for the selected service. Browser math is a preview; `src/server/services/phase-a.ts` reloads the rates, checks service/area eligibility, calculates duration/pay/transport, and derives the booking end time before writing. The booking stores the estimate inputs and calculated minutes. The owner-confirmed primary-service rule is in [ADR 003](adr/003-server-calculated-booking-estimates.md). Missing settings fail closed. Migration 0018 is forward-only and has not been applied until local Supabase is running.

## Stage 2.1 — actor-aware booking reads

Booking reads exposed to pages go through a server-only read service. It resolves the current actor with the authenticated server session; callers do not supply a role or user ID. The service validates the booking ID, applies an actor-specific database scope before loading private fields, and returns a role-specific DTO rather than a raw row. A missing, wrong-role, wrong-owner, or unauthorized booking returns the same `not_found` result.

- Host: only bookings whose `host_id` matches the authenticated host. The host may see their own address and access notes. Assigned helper phone numbers are included only after all slots are assigned.
- Helper: only an active booking offer for that helper or an accepted/completed assignment for that helper. Before assignment, expose only the fields allowed by spec 6.4 (suburb, transport allowance, and pay). After assignment, add the booking address and the host's first name and phone.
- Admin: require both an authenticated admin profile and membership in the `admins` table. Return the minimum operational booking data; never include helper ID data, document paths, or encrypted columns.

The server read uses the service-role client only after verifying the actor and scoping every query by the authenticated ID or admin membership. This does not replace RLS: integration tests use real anon/authenticated Supabase clients and disposable identities against the local stack to verify anon denial, host ownership, wrong-owner/wrong-role denial, and admin access. The linked Supabase project is never a test target.

## Mobile design implementation

`docs/design-reference/DESIGN_TOKENS.md` is the styling source. `src/styles/tokens.css` is the only implementation of those values. Components use token-based CSS classes/variables; they do not introduce raw colour, spacing, radius, or typography values.

The public UX source is `docs/ux/ux-blueprint.md`. Stage 1 builds the home page sections (hero, host/helper paths, host steps, fast picks, trust cues, helper block, FAQ, final calls to action, footer) rather than separate Services or How it works marketing pages. `/request` and `/apply` are hand-off routes only: they redirect to the role-specific sign-up entry point and contain no marketing content, form, or data collection. All user-facing words come from generated `src/content/copy.generated.ts` via a small `t(key, variables)` reader.

## Route map for Phase A

| Route | State while prototype routes disabled |
|---|---|
| `/` | Public home: approved hero, host/helper entry, how-it-works, services, trust cues, helper information, FAQ, and closing actions; includes a non-collecting holding notice |
| `/about`, `/contact` | Public informational pages; no forms or persistence until the UX/content gate allows collection |
| `/services`, `/how-it-works` | Compatibility redirects to `/#services` and `/#how-it-works`; the content lives on `/` |
| `/request` | Host request entry point; redirects to `/signup?role=host` when unauthenticated |
| `/apply` | Helper application entry point; redirects to `/signup?role=helper` when unauthenticated |
| `/privacy`, `/terms` | Public legal placeholders; no invented legal text |
| `/signup`, `/login` | Shared account entry; non-collecting holding state while prototype routes are disabled; role is allow-listed and stored server-side when enabled |
| `/app/onboarding`, `/app/profile`, `/app/book`, `/app/requests`, `/app/requests/[id]`, `/app/report` | Host-owned Phase A screens; the booking estimate is recomputed on the server from configured rates and home details |
| `/helper`, `/helper/onboarding`, `/helper/profile`, `/helper/jobs`, `/helper/jobs/[id]`, `/helper/report` | Helper-owned Phase A screens |
| `/admin/login` | Admin sign-in; direct operational path, intentionally absent from public navigation |
| `/admin`, `/admin/helpers`, `/admin/helpers/[id]`, `/admin/bookings`, `/admin/bookings/[id]`, `/admin/reports`, `/admin/overview`, `/admin/audit` | Admin-only Phase A screens; audit is a read-only view of recorded actions |
| `/api/*` | Phase A route handlers; prototype switch is the first statement and disabled routes return 404 |
| `/book`, `/cleaners/apply` | Removed as superseded routes |

## Verification

- Type check, lint, tests, build, copy build, structure check, asset check, Knip, and audit all run after each batch.
- Tests cover the prototype route gate, direct action guards, authorization, state transitions, redaction, rotation, atomic acceptance, check-in attempts and subscription eligibility.
- At 375 px, public-shell keyboard navigation, visible focus, page landmarks, and no horizontal scrolling are checked.

## Decisions recorded

- The existing migration is immutable because it is treated as applied.
- The public deployment is a non-collecting prototype by default.
- The owner approved the full token direction on 26 October 2026. The token source is `docs/design-reference/DESIGN_TOKENS.md`; implementation remains one generated stylesheet in `src/styles/tokens.css`. Reference extraction files include 375 px, 768 px and 1440 px captures.
- Login uses Postgres counters per ADR 010. The login lock applies to one account/IP pair after 5 failed attempts in 15 minutes; 20 failures per account in an hour triggers Turnstile on the next attempt without a cross-IP account lock.
