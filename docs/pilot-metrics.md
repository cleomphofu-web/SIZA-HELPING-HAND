# SIZA Phase A — Pilot Metrics & Launch Measurement Framework

**Purpose:** First-party metrics framework to measure marketplace health during the pilot without third-party tracking scripts, cookies, or privacy invasive analytics.

---

## 1. Core Marketplace Metrics

In accordance with `docs/SIZA-v2-spec.md` (Section 8.1) and `docs/plans/siza-phase-a.md` (Stage 5.3), the pilot measures the following dimensions using first-party database records only:

| Metric | Target | Measurement Method |
|---|---|---|
| **Booking Volume** | 10–30 requests/week | `COUNT(*)` in `phase_a_bookings` where `created_at` in window |
| **Acceptance Latency** | < 15 minutes median | `EXTRACT(EPOCH FROM (ba.created_at - b.created_at))` |
| **Fulfillment Rate** | > 85% of requests assigned | `COUNT(status IN ('assigned', 'in_progress', 'completed')) / COUNT(*)` |
| **Completion Rate** | > 95% of assigned jobs | `COUNT(status = 'completed') / COUNT(status IN ('assigned', 'in_progress', 'completed'))` |
| **Repeat Host Rate** | > 30% after 4 weeks | `COUNT(DISTINCT host_id HAVING COUNT(*) > 1) / COUNT(DISTINCT host_id)` |
| **Helper No-Show Rate** | < 2% of assigned slots | `COUNT(status = 'no_show') / COUNT(*)` in `booking_assignments` |
| **Active Helper Base** | 15–25 approved helpers | `COUNT(*)` in `helper_details` where `status = 'approved'` |
| **Subscription Conversion** | > 60% after first job | Helpers who paid subscription after `first_job_completed_at` |
| **Incident Reports** | < 3% of bookings | `COUNT(DISTINCT booking_id)` in `phase_a_reports` / Total completed |

---

## 2. SQL Measurement Queries (First-Party)

These queries run against the database directly without collecting or transmitting any PII:

### 2.1 Weekly Marketplace Summary
```sql
select
  date_trunc('week', b.created_at) as week_start,
  count(*) as total_requests,
  count(*) filter (where b.status in ('assigned', 'in_progress', 'completed')) as fulfilled_requests,
  count(*) filter (where b.status = 'completed') as completed_requests,
  count(*) filter (where b.status = 'expired') as expired_requests,
  count(*) filter (where b.status = 'cancelled') as cancelled_requests
from public.phase_a_bookings b
group by 1
order by 1 desc;
```

### 2.2 Helper Acceptance Speed
```sql
select
  percentile_cont(0.5) within group (
    order by extract(epoch from (ba.created_at - b.created_at)) / 60
  ) as median_minutes_to_accept,
  percentile_cont(0.9) within group (
    order by extract(epoch from (ba.created_at - b.created_at)) / 60
  ) as p90_minutes_to_accept
from public.booking_assignments ba
join public.phase_a_bookings b on b.id = ba.booking_id
where ba.status in ('accepted', 'completed');
```

### 2.3 Post-First-Job Helper Retention
```sql
select
  count(*) filter (where first_job_completed_at is not null) as helpers_completed_first_job,
  count(*) filter (where first_job_completed_at is not null and subscription_status = 'active') as helpers_subscribed,
  round(
    100.0 * count(*) filter (where first_job_completed_at is not null and subscription_status = 'active')
    / nullif(count(*) filter (where first_job_completed_at is not null), 0),
    1
  ) as subscription_conversion_percent
from public.helper_details
where status = 'approved';
```

---

## 3. Pilot Pilot Suburbs (Johannesburg)

Pilot launch is bounded to the approved pilot zones:
- Rosebank & Parkhurst
- Craighall Park & Blairgowrie
- Sandton & Morningside
- Fourways & Lonehill
- Greenside & Linden

Requests outside these suburbs are refused gracefully via the suburb check in `HostBookingForm.tsx`.

---

## 4. Phase B Gate Checklist (Spec 8.1)

Before Phase B work (in-app card payments, funds holding, automated ledger, and EFT payouts) may begin:
- [ ] Legal and accounting gate cleared in writing by the owner.
- [ ] At least 100 successful completed pilot jobs without safety or dispute escalation.
- [ ] Helper repeat intent confirmed by hosts on > 80% of jobs.
- [ ] Merchant banking and payout accounts approved and tested on Paystack/Ozow.
- [ ] Owner approval of architecture decision record (`docs/adr/`) for Phase B ledger.

