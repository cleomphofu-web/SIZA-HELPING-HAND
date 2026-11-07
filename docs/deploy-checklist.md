# SIZA Phase A — Production Deployment & Domain Checklist

**Purpose:** Executable checklist for deploying SIZA Phase A to production.

---

## 1. Environment Variables Checklist

Ensure the following variables are configured in production hosting (e.g., Vercel / Railway / Node host):

| Variable | Description | Requirement |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Public canonical URL (e.g., `https://siza.co.za`) | Required |
| `SUPABASE_URL` | Production Supabase project URL | Required |
| `SUPABASE_ANON_KEY` | Supabase publishable anonymous key | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role secret (never exposed to client) | Required (Server-only) |
| `ID_ENCRYPTION_KEY` | Base64-encoded 32-byte cryptographic key | Required (Server-only) |
| `RESEND_API_KEY` | Resend production API key | Required (Server-only) |
| `RESEND_FROM_EMAIL` | Verified sending address (e.g. `siZa <notifications@siza.co.za>`) | Required (Server-only) |
| `ADMIN_NOTIFY_EMAIL` | Destination mailbox for admin alerts (applications, bookings) | Required (Server-only) |
| `MAINTENANCE_JOB_SECRET` | 32+ character bearer secret for scheduled jobs | Required (Server-only) |
| `WHATSAPP_GROUP_LINK` | Support / onboarding WhatsApp community invite | Required (Server-only) |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key | Required (Server-only) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile public site key | Required (Client-safe) |
| `NEXT_PUBLIC_HERO_VIDEO_ID` | Approved hero background video asset ID | Optional (fallback type) |

---

## 2. DNS & Domain Configuration

### 2.1 Web Domain (e.g., `siza.co.za`)
- [ ] A / CNAME records pointing to production hosting server.
- [ ] HTTPS enforced (TLS 1.3 preferred, TLS 1.2 minimum).
- [ ] HSTS header configured (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`).

### 2.2 Email Domain (Resend)
- [ ] SPF record: `v=spf1 include:amazonses.com ~all` (or Resend provider recommendation).
- [ ] DKIM key records configured as CNAMEs in DNS and verified in Resend dashboard.
- [ ] DMARC record: `v=DMARC1; p=quarantine; rua=mailto:dmarc@siza.co.za`.
- [ ] Test transactional email dispatch via `POST /api/jobs/email-outbox`.

### 2.3 Cloudflare Turnstile
- [ ] Production hostname registered in Cloudflare Turnstile dashboard.
- [ ] Public site key and secret key configured in environment.

---

## 3. Database & Storage Preparation

- [ ] Run `supabase db push` to ensure all migrations through `20261106030000_booking_messages.sql` are applied.
- [ ] Verify private storage buckets exist:
  - `helper-docs` (Private, RLS enabled, only service role can read/write).
  - `helper-avatars` (Public read, authenticated helper write).
- [ ] Verify `app_config` production seeds:
  - `offer_window_minutes`: `10`
  - `no_show_minutes`: `30`
  - `check_in_lock_minutes`: `15`
  - `id_doc_retention_days`: `30`
  - `check_in_expiry_hours`: `12`
  - `confirm_grace_hours`: `12`
  - `auto_release_hours`: `24`
  - `subscription_monthly_cents`: `15000` (R150)
  - `min_hourly_floor_cents`: `10000` (R100)
- [ ] Run database backup drill: `supabase db dump -f backup.sql` and verify restoration on a test container.

---

## 4. Scheduled Jobs Configuration (Cron / Scheduler)

Set up HTTP cron triggers (e.g. GitHub Actions, Vercel Cron, or Cloudflare Workers) calling with `Authorization: Bearer $MAINTENANCE_JOB_SECRET`:

| Job Endpoint | Recommended Frequency | Purpose |
|---|---|---|
| `POST /api/jobs/email-outbox` | Every 1–2 minutes | Drains pending email notifications reliably |
| `POST /api/jobs/retention` | Every 10–15 minutes | Booking expiry, auto-release, rate-limit prune, doc purge |
| `POST /api/jobs/subscription-reminders` | Daily at 08:00 SAST | Enqueues reminders for helpers with ending plans |

---

## 5. Security Headers & Browser Smoke Pass

Verify responses contain:
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- [ ] 375 px mobile viewport check on host dashboard, booking form, helper jobs, and admin screens.
- [ ] Admin TOTP MFA enrollment verified with real owner authenticator app.

