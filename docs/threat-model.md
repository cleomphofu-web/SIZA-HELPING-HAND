# SIZA Phase A — Threat Model & Security Architecture

**Status:** Complete for Phase A  
**Scope:** Two-sided helper-booking web application (Johannesburg & Vaal pilot)  
**Boundary:** Non-holding pilot (no card processing or funds held by SIZA)

---

## 1. Security Architecture Principles

1. **Server-Only Data Access:** The client browser never interacts directly with Supabase tables via client-side libraries. All data access occurs through `src/server/*` server components, Server Actions, and API route handlers using the service-role client with server-enforced role and ownership checks.
2. **Never Trust the Client:** Price, duration, status, and assignment logic are recomputed on the server. Client input is strictly parsed via Zod schemas and checked against database state.
3. **Defense in Depth Pipeline:** Every mutating API route and Server Action follows an ordered pipeline:
   `Origin Check` → `Rate Limiting` → `Bot Verification (Turnstile)` → `Schema Validation` → `Actor Authorization` → `Domain Service Execution`.
4. **PII and Data Redaction:** ID numbers are AES-256-GCM encrypted at rest (`p_id_number_encrypted`) and irreversibly SHA-256 hashed with salt (`p_id_hash`) for uniqueness checks. Plaintext ID numbers are never stored and are purged immediately upon approval/decline. Host address and phone details are only revealed to assigned helpers after slot confirmation.
5. **No AI Features or Untrusted Code Execution:** No AI or automated decision models operate on user data or matching.

---

## 2. Row-Level Security (RLS) & Table Matrix

All public tables have RLS enabled with explicit restrictive policies:

| Table | Direct Authenticated Access | Access Enforcement |
|---|---|---|
| `public.profiles` | Read-only for self; direct writes revoked (`0013`) | Server-only service functions update profile details |
| `public.host_details` | Read/write own row only (`user_id = auth.uid()`) | Server action validates address & suburb boundaries |
| `public.helper_details` | Server-only (`20261026220000`) | Admin/Helper views redact unassigned/unapproved fields |
| `public.phase_a_bookings` | Host reads owned; Helper reads assigned/offers | Atomic RPCs manage creation, assignment, and status |
| `public.booking_assignments` | Host reads owned booking; Helper reads self | Atomic `claim_phase_a_slot` serializes concurrency |
| `public.booking_messages` | Host & assigned helper on specific booking | Scoped access verification in `booking-messages.ts` |
| `public.in_app_notifications` | Read/update own notifications (`user_id = auth.uid()`) | Server-only creation from domain events |
| `public.phase_a_email_outbox` | Server-only service role | Enqueued by domain events, processed by cron/job runner |
| `public.rate_limit_counters` | Server-only service role | Atomic sliding window counter function |
| `public.admin_mfa_codes` | Server-only service role | Service-keyed digest reservation prevents TOTP replay |

---

## 3. Threat Matrix & Mitigations

### 3.1 Authentication & Session Hijacking
- **Threat:** Credential stuffing, brute-force login, session replay.
- **Mitigation:**
  - Dedicated Postgres failure buckets: 5 failed attempts per account/IP pair in 15 minutes locks the pair (`ADR 010`).
  - Turnstile challenge required after 20 aggregate account failures per hour.
  - Supabase cookies configured with `HttpOnly`, `SameSite=Lax`, `Secure` (production), and 1-hour expiry.
  - Admin login requires mandatory TOTP enrollment and `aal2` verification on every protected admin route. Single-use code digest reservation blocks TOTP replay.

### 3.2 Race Conditions & Double-Booking
- **Threat:** Multiple helpers claiming the same slot simultaneously; concurrent assignments creating double-bookings.
- **Mitigation:**
  - `claim_phase_a_slot` uses PostgreSQL row locks (`SELECT ... FOR UPDATE`) and transaction isolation.
  - Overlap exclusion function verifies that helpers with an accepted job overlapping the time window cannot claim or be offered another job.

### 3.3 Access Code Brute-Force (Check-In)
- **Threat:** Unassigned party guessing the 6-digit arrival check-in code.
- **Mitigation:**
  - HMAC-SHA256 hashed code stored at rest; plaintext never stored.
  - Maximum 5 failed attempts locks check-in attempts for 15 minutes (`check_in_lock_minutes`).
  - Check-in expires after configured hours (`check_in_expiry_hours`).

### 3.4 In-App Messages & Access Notes
- **Threat:** Unauthorized users reading gate codes or posting spam.
- **Mitigation:**
  - Scoped server check in `resolveAccess`: only the booking host, actively assigned helpers, and authenticated admins can read or post notes.
  - Character limit strictly enforced (1–1,000 chars).
  - Messages are append-only; editing or deletion is prohibited to preserve an unalterable coordination audit trail.

### 3.5 Automated Maintenance & Retention Exposure
- **Threat:** Unauthorized trigger of document purge, subscription lapse, or outbox processing.
- **Mitigation:**
  - Bearer token matching `MAINTENANCE_JOB_SECRET` (minimum 32 characters).
  - Timing-safe comparison using `crypto.timingSafeEqual` after SHA-256 digest hashing to prevent timing attacks.
  - Rejection of unexpected request bodies or query parameters.

---

## 4. Cryptographic Standards

- **ID Encryption:** AES-256-GCM using base64-encoded 32-byte key (`ID_ENCRYPTION_KEY`).
- **Identifier Hashing:** Salted SHA-256 digest for non-reversible duplicate detection.
- **Check-in Codes:** Cryptographically secure 6-digit random generator (`crypto.randomInt`), HMAC-SHA256 verified.
- **Idempotency Keys:** Deterministic SHA-256 digest of `event_type:entity_id` preventing duplicate email dispatch or charge generation.

