# SIZA: launch and running costs (Phase A pilot)

Prices come from third-party pages checked Aug-Oct 2026 and the exchange rate on 8 Oct 2026 (about R16.65 per US$). **Verify every price at checkout; they change.** Rand figures are rounded.

## 1. Monthly, from publish day
| Item | Cost | Notes |
|---|---|---|
| Hosting: Vercel Pro | $20 (R333) per user | Free Hobby plan is not allowed for commercial use. Includes a $20 usage credit; overages unlikely at pilot size |
| Database, auth, file storage: Supabase Pro | $25 (R416) | Includes a $10 compute credit that covers the smallest database server; 8 GB database, 100 GB files, 7 days of daily backups. Free plan can pause, so do not publish on it |
| Email sending: Resend | Free | 3,000 emails a month, 100 a day, one domain. Pro is $20 (R333) if you pass 100 a day |
| Error tracking (Sentry) and bot check (Cloudflare Turnstile) | Free plans | Confirm current free limits |
| Domain (.co.za) | about R99 a year (about R8 a month) | Needed for email sending and trust. The registry fee rose 6.2% on 1 Oct 2026, so renewals may cost slightly more |
| Business bank account | about R50 | Example: Capitec Business |
| Bookkeeping/accounting | R0 (DIY) to about R500 (R6,000 a year outsourced) | |
| Public liability insurance | R300 to R1,500, quote-based | Strongly worth quoting before real jobs |
| WhatsApp channel or group | Free | |

**Totals per month**
- Minimum (DIY accounting, no insurance): about **R807** (R333 + R416 + R8 + R50).
- With outsourced bookkeeping: about **R1,307**.
- With insurance: about **R1,600 to R2,800**.
- Optional staging copy of the database: add about R167.

## 2. One-off, before publishing
| Item | Cost |
|---|---|
| Company registration (CIPC Pty, short form) | R175 (R125 without a name) plus R50 name reservation |
| Domain | about R99 for the first year |
| Lawyer: terms, privacy notice, worker status, POPIA | Get quotes (I have no verified figure) |
| Accountant setup, tax and VAT advice | Get quotes |
| Information Officer registration | Check the regulator's current requirements |
| Insurance quote | Free to request |
| Trademark (optional) | about R590 per class |
| Real-device testing, a logo file set, photos with consent | Your time; some cost if you hire help |

## 3. Yearly
CIPC annual return about R100 (turnover under R1m); domain renewal; insurance; accounting and tax returns; a yearly legal review of terms and privacy.

## 4. Variable (grows with usage)
- Phase B payment fees: card about 2.85% plus R2 per sale and instant bank payment about 1.5% in the earlier research. Confirm with each provider. 1Voucher works through a payment gateway, and its fees are not confirmed.
- Supabase: database above 8 GB $0.125 per GB; data out above 250 GB $0.09 per GB. Vercel and Resend: overages billed per use.
- Bank charges on EFT receipts and payouts.

## 5. Maintenance (your time, my estimates)
| When | Work | Rough time |
|---|---|---|
| Daily or every few days | Approve cleaners, handle reports, mark subscription payments, answer support | 2 to 5 hours a week at pilot size |
| Weekly | Check Sentry errors, the overview page, no-show and complaint numbers | 30 minutes |
| Monthly | Update dependencies, run the security audit, review costs, check email delivery | 3 to 4 hours |
| Quarterly | Restore a backup to test it, review the rate card and transport costs, check access and keys | half a day |
| Yearly | Rotate secrets, renew domain and registrations, legal and privacy review, tax filing | a few days |
Maintenance also includes responding to incidents (a leak, a downtime, a fraud case): keep the breach runbook and a support rota ready.

## 6. Break-even at R100 a month per cleaner
Number of paying cleaners needed = monthly costs ÷ about R100.
- R807 a month: about 9 paying cleaners.
- R1,307: about 14.
- R1,600 (with the cheapest insurance): about 16.
- R2,800 (dearest insurance): about 28.
The first job is free and some cleaners will lapse, so plan on roughly 1.5 times these numbers signing up. At R100 a month, 20 paying cleaners bring in R2,000.

## 7. Ways to keep it lean (without hurting quality)
One Supabase project until launch (use the local copy for development); stay on the free email plan; no maps, SMS, chat or AI; no staging environment until real users arrive. Do not save money on: the paid database plan, backups, the insurance quote, and the legal review.
