# SIZA copy deck (single source of all words on the site)

**How this file works.** One line per piece of text: `key: text`. Lines starting with `#`, `>` or blank are ignored by the build. Run `npm run build:copy` to generate `src/content/copy.generated.ts` (never edit that file, never type site text in components). Variables in `{braces}` are filled by code: `{supportEmail}`, `{whatsappUrl}`, `{subscriptionPrice}`, `{subscriptionDays}`, `{year}`, `{firstName}`, `{areas}` and the per-key ones named in the text.
**Rules (checked by the build).** Words per `siza-brand-voice-and-copy`. Banned anywhere: guarantee, insured, background check, secure payment, escrow, 100% safe, "you choose". The word "vetted" and the ID-check claims live only in keys starting `claim.`, which the site shows only when the matching switch is on (set when the code enforces it). `[OWNER: ...]` and `[CONFIRM: ...]` mark facts only the owner can supply: the build lists them and, in strict mode (production), fails until they are resolved. No invented numbers, people, quotes or reviews.
**Terms.** helper (never "cleaner" in the product), host, request, assigned, check-in code. Voice: plain, warm, direct; short sentences.

## Site-wide
site.name: SIZA
site.tagline: Help, made fair.
site.areas: Johannesburg and the Vaal
nav.about: About us
nav.request: Request a helper
nav.apply: Apply to be a helper
nav.contact: Contact
nav.login: Log in
nav.signup: Sign up
nav.menu: Menu
nav.close: Close
nav.skip: Skip to main content
footer.tagline: Help for your home. Fair work for helpers.
footer.areas: Serving Johannesburg and the Vaal
footer.privacy: Privacy policy
footer.terms: Terms and conditions
footer.contact: Contact us
footer.rights: © {year} SIZA. All rights reserved.
button.request: Request a helper
button.apply: Apply to be a helper
button.book_team: Book a team
button.book_helper: Book a helper
button.continue: Continue
button.back: Back
button.save: Save
button.cancel: Cancel
button.confirm: Confirm
button.submit: Submit
button.try_again: Try again
button.notify_me: Notify me
button.message_whatsapp: Message on WhatsApp
button.copy: Copy
button.sign_out: Sign out
label.coming_soon: Coming soon
label.required: Required
label.optional: Optional
label.draft: Draft

## Mandatory notices (word for word)
notice.outside: Agreements made outside SIZA are not SIZA's responsibility.
notice.address: Your address is shared with the helper(s) assigned to you.
notice.payment.phase_a: Payment is arranged directly between you and the helper after the job. SIZA does not hold funds or cover payment disputes.
notice.payment.phase_b: {{LEGAL_TEXT_PENDING}}
notice.public_profile: Your first name, photo, job title, services, areas and reviews will be visible to hosts. Your phone number and surname stay private until a job is assigned.
notice.demo: Demo data. Nothing you enter here is saved or sent.
notice.price_draft: Draft prices. These will change after we test with real helpers and hosts.

## SEO
seo.home.title: SIZA | Help for your home, fair work for helpers
seo.home.description: Request a helper for your home or short-stay property in Johannesburg and the Vaal, or apply to be a helper and see your pay before you accept.
seo.about.title: About SIZA | Help, made fair
seo.about.description: SIZA connects people who need a hand with helpers who do the work, fairly. Johannesburg and the Vaal.
seo.request.title: Request a helper | SIZA
seo.request.description: Tell us what you need, see the price first, and we find a helper near you.
seo.apply.title: Apply to be a helper | SIZA
seo.apply.description: See your pay and transport before you accept a job. Apply to be a SIZA helper in Johannesburg or the Vaal.
seo.contact.title: Contact | SIZA
seo.contact.description: Questions, problems or ideas? Reach SIZA by email, WhatsApp or the form.

## Home: hero
home.hero.eyebrow: SIZA // {areas}
home.hero.switch.host: I need help
home.hero.switch.helper: I want work
home.hero.host.title: Guest-ready, between every stay.
home.hero.host.subtitle: Request a helper for your home or short-stay property. See the price before you confirm. Your request goes to helpers near you.
home.hero.host.cta: Request a helper
home.hero.host.cta_secondary: See how it works
home.hero.helper.title: Fair work, near you.
home.hero.helper.subtitle: Apply to be a SIZA helper. See your pay and transport before you accept a job, and keep all of it.
home.hero.helper.cta: Apply to be a helper
home.hero.helper.cta_secondary: What helpers earn

## Home: how it works (hosts)
home.how.label: HOW IT WORKS //
home.how.title: FOR HOSTS
home.how.subtitle: *(FOUR SIMPLE STEPS)
home.how.host.1.label: //Step 01
home.how.host.1.title: Tell us what you need
home.how.host.1.body: Pick a service, a date and a time. See the price before you confirm.
home.how.host.2.label: //Step 02
home.how.host.2.title: We find a helper near you
home.how.host.2.body: Your request goes to helpers in your area. The first to accept gets the job.
home.how.host.3.label: //Step 03
home.how.host.3.title: Meet your helper
home.how.host.3.body: See their profile and get your check-in code. Your address is shared only with the helper assigned to you.
home.how.host.4.label: //Step 04
home.how.host.4.title: Check in and get it done
home.how.host.4.body: Give your helper the code when they arrive. When the job is done, confirm it.

## Home: services
home.services.label: WHAT WE DO //
home.services.title: SERVICES
home.services.subtitle: *(START WITH HOME CLEANING)
service.home_cleaning.title: Home cleaning
service.home_cleaning.body: Regular and once-off cleans for flats and houses.
service.airbnb_turnover.title: Airbnb turnover
service.airbnb_turnover.body: Beds, bathrooms and kitchen reset between guests, so you are guest-ready.
service.office.title: Office cleaning
service.office.body: Tidy workspaces for small offices.
service.garden.title: Garden
service.garden.body: Mowing, trimming, weeding and rubbish removal.
service.handyman.title: Handyman
service.handyman.body: Small jobs around the house like assembly and hanging. No electrical, plumbing, gas, roofing or structural work.
service.custom.title: Something else
service.custom.body: Tell us what you need and we will let you know if we can help.
service.coming_soon_note: We open each service in a suburb once enough helpers there are approved.

## Home: why SIZA (only claims the product enforces)
home.why.label: WHY SIZA //
home.why.title: BUILT ON FAIRNESS
home.why.price.title: See the price first
home.why.price.body: Your price is worked out from the job, and you see the full amount before you confirm.
home.why.address.title: Your address stays private
home.why.address.body: Helpers see only your suburb until a helper is assigned to you.
home.why.code.title: The right person arrives
home.why.code.body: A check-in code shows your helper is the person we sent.
home.why.fair.title: Fair turns for helpers
home.why.fair.body: New jobs are offered first to helpers with the fewest recent jobs, so good work is not only for the fastest phone.
claim.id_checked.title: ID and selfie checked
claim.id_checked.body: Every helper's ID and selfie are checked by SIZA before they can accept jobs.
claim.references.title: References called
claim.references.body: We call a helper's reference before approving them.

## Home: for helpers
home.helpers.label: FOR HELPERS //
home.helpers.title: WORK THAT RESPECTS YOU
home.helpers.pay.title: See your pay first
home.helpers.pay.body: Your pay and transport are shown before you accept. SIZA takes no commission from them.
home.helpers.free.title: Your first job is free
home.helpers.free.body: Joining is free. After your first completed job, SIZA costs R{subscriptionPrice} for {subscriptionDays} days. No debit orders.
home.helpers.no_penalty.title: Say no, any time
home.helpers.no_penalty.body: Accept the jobs that suit you. Declining or turning off availability has no penalty.
home.helpers.cta: Apply to be a helper

## Home: FAQ
faq.label: FREQUENTLY ASKED //
faq.title: QUESTIONS
faq.subtitle: *(ANSWERED)
faq.1.q: How much does it cost?
faq.1.a: The price depends on the service, the size of your home and where you are. You see the total before you confirm.
faq.2.q: How do I pay?
faq.2.a: Payment is arranged directly between you and the helper after the job. SIZA does not hold funds or cover payment disputes.
faq.3.q: Is my address safe?
faq.3.a: Helpers see only your suburb until a helper is assigned to you. Then only that helper sees your address.
faq.4.q: What if no helper accepts?
faq.4.a: Your request is offered first to a few helpers, then to everyone eligible. If nobody accepts, we tell you so you can change the time or the pay, or try later. Open requests close after 48 hours.
faq.5.q: Can I cancel?
faq.5.a: Yes, free of charge before a helper is assigned. After that, the cancellation rules shown when you book apply. [OWNER: cancellation rules and numbers]
faq.6.q: What can helpers do?
faq.6.a: Helpers do the job you booked. Handyman jobs exclude electrical, plumbing, gas, roofing and structural work.
faq.7.q: Which areas do you serve?
faq.7.a: Johannesburg and the Vaal, suburb by suburb. We open a suburb when enough helpers there are approved. [OWNER: list of open suburbs]
faq.8.q: What is the check-in code?
faq.8.a: A short code you give your helper when they arrive. It shows the right person turned up and it starts the job.
faq.9.q: How do I become a helper?
faq.9.a: Apply online with your South African ID, a clear selfie, your cell number and one reference. You must be 18 or older. We review every application and contact you.
faq.10.q: What does SIZA cost helpers?
faq.10.a: Your first completed job is free. After that it is R{subscriptionPrice} for {subscriptionDays} days. SIZA takes no commission from your pay.
faq.11.q: Can I decline jobs?
faq.11.a: Yes. Accept the jobs that suit you. There is no penalty for declining or for being unavailable.
faq.12.q: How do I report a problem?
faq.12.a: Use the Report button on any job, or contact us. We look at every report.
faq.13.q: What happens to my personal information?
faq.13.a: We only ask for what we need. [CONFIRM: final wording of retention and privacy from the lawyer, see the privacy policy]
claim.retention.a: ID photos and selfies are seen only by SIZA's admin and deleted 30 days after we decide on an application.

## Home: closing band
home.cta.label: START //
home.cta.title: NEED A HAND, OR WANT WORK?
home.cta.host.title: Need a hand?
home.cta.host.body: Request a helper for your home or short-stay property.
home.cta.helper.title: Want fair work?
home.cta.helper.body: Apply to be a helper and see your pay before you accept.

## About page (concept in docs/ux/about-page.md)
about.hero.label: ABOUT SIZA //
about.hero.title: SIZA means help.
about.hero.subtitle: *(A MARKETPLACE FOR GOOD WORK AND TRUSTED HELP)
about.hero.body: [CONFIRM: with an isiZulu speaker that "siza" means "to help"] We built a company around a verb. SIZA connects people who need a hand with people who are good at giving one, in {areas}.
about.name.label: THE NAME //
about.name.zulu: Siza (isiZulu): to help.
about.name.sesotho: Thusa (Sesotho): to help. [CONFIRM: spelling and meaning with a Sesotho speaker]
about.name.english: Help (English).
about.name.afrikaans: Help (Afrikaans). [CONFIRM: with an Afrikaans speaker]
about.name.line: Gauteng speaks many languages. The idea is the same in all of them.
about.why.label: WHY WE EXIST //
about.why.title: TWO SIDES OF ONE DOOR
about.why.note: An everyday story
about.why.host: Check-out is at 10:00. The next guests arrive at 14:00. The person you trusted just cancelled. You open your phone and start searching.
about.why.helper: You are good at this work. Good work is hard to find, and fair work is harder. Half your day goes on getting there. Nobody remembers who always shows up.
about.why.bridge: SIZA is the door between them: clear prices, fair turns, and proof that the right person arrived. [OWNER: add one real story in your own words]
about.believe.label: WHAT WE BELIEVE //
about.believe.1.title: Fair by design
about.believe.1.body: Helpers keep their full pay and transport. SIZA does not take a commission out of a helper's pay.
about.believe.2.title: Everyone gets a turn
about.believe.2.body: New jobs are offered first to the helpers with the fewest recent jobs, then opened to everyone. Speed should not be the only thing that wins work.
about.believe.3.title: Safe by design
about.believe.3.body: Your address stays private until a helper is assigned. A check-in code shows the right person arrived.
about.believe.4.title: Honest about limits
about.believe.4.body: We say what we do and what we do not do yet, in plain words.
about.job.label: A SIZA JOB, START TO FINISH //
about.job.note: An example job. The people are made up.
about.job.1: 08:05 Request. Thandi books a standard clean for her two-bedroom flat. She sees the price before she confirms.
about.job.2: 08:06 Offered. Three helpers nearby are offered the job first.
about.job.3: 08:11 Accepted. Lerato accepts. Thandi sees her profile and her check-in code.
about.job.4: 10:00 Arrival. Lerato enters the code Thandi gives her. Both know the right person is there.
about.job.5: 13:30 Done. Both confirm. Thandi pays Lerato directly.
about.where.label: FROM JOHANNESBURG TO THE VAAL //
about.where.body: We open a suburb when enough helpers there are approved, so a request never sits unanswered. [OWNER: suburb list]
about.where.notify: Not in your suburb yet? Tell us and we will tell you when we arrive.
about.limits.label: WHAT WE DO NOT DO (YET) //
about.limits.today.title: Today
about.limits.today.1: SIZA does not hold your money. You pay your helper directly after the job.
about.limits.today.2: SIZA does not replace your own home or business cover. [CONFIRM: insurance position before publishing]
about.limits.coming.title: Coming
about.limits.coming.1: Protected card payments
about.limits.coming.2: Reviews and ratings
about.limits.coming.3: More services
about.limits.closing: We would rather tell you what we cannot do yet than promise what we cannot prove.
about.people.label: THE PEOPLE //
about.people.founder.name: [OWNER: founder name]
about.people.founder.role: Founder
about.people.founder.story: [OWNER: three or four sentences in the first person on why you started SIZA]
about.cta.label: WORK WITH SIZA //
about.cta.host.title: Need a hand?
about.cta.host.body: Request a helper.
about.cta.helper.title: Want steady, fair work?
about.cta.helper.body: Apply to be a helper.
about.cta.questions: Questions? {supportEmail}

## Request page
request.hero.label: REQUEST A HELPER //
request.hero.title: Tell us what you need.
request.hero.subtitle: *(IT TAKES A FEW MINUTES)
request.hero.body: Create a free account, save your address once, and request a helper whenever you need one.
request.steps.1: Create your account and save your address.
request.steps.2: Pick a service, a date and a time, and see the price.
request.steps.3: We find a helper near you.
request.cta: Create your free account
request.login: Already have an account? Log in

## Apply page
apply.hero.label: BECOME A HELPER //
apply.hero.title: Fair work, near you.
apply.hero.subtitle: *(SEE YOUR PAY BEFORE YOU ACCEPT)
apply.hero.body: SIZA offers you jobs in {areas}. Accept the ones that suit you and keep your full pay and transport.
apply.earn.title: What you earn
apply.earn.body: Your pay and transport are shown on every job before you accept. SIZA takes no commission from them. [CONFIRM: add one real example once the rate card is final]
apply.cost.title: What it costs
apply.cost.body: Joining is free. After your first completed job, SIZA costs R{subscriptionPrice} for {subscriptionDays} days. You pay on purpose, never by debit order.
apply.need.title: What you need
apply.need.1: A South African ID
apply.need.2: A clear selfie, and a selfie holding your ID
apply.need.3: A cell number
apply.need.4: One reference we can call
apply.need.5: You must be 18 or older
apply.after.title: What happens next
apply.after.body: We review your application and contact you. [OWNER: how long this takes]
apply.cta: Start your application
apply.login: Already applied? Log in

## Contact page
contact.hero.label: CONTACT //
contact.hero.title: Ask us anything.
contact.hero.subtitle: *(WE READ EVERY MESSAGE)
contact.hero.body: Email {supportEmail}, message us on WhatsApp, or use the form. [OWNER: hours and how fast you reply]
contact.whatsapp: Message us on WhatsApp
contact.email: Email us
contact.form.name: Your name
contact.form.email: Email address
contact.form.phone: Cell number (optional)
contact.form.type: What is this about?
contact.form.type.general: A general question
contact.form.type.request: Requesting a helper
contact.form.type.apply: Applying to be a helper
contact.form.type.report: Reporting a problem
contact.form.type.other: Something else
contact.form.suburb: Suburb (optional)
contact.form.message: Your message
contact.form.submit: Send message
contact.form.success: Thank you. We will reply as soon as we can.
contact.form.error: We could not send your message. Please email {supportEmail} instead.
contact.form.prototype: This form is not live yet. Please email {supportEmail} or message us on WhatsApp.
contact.safety.title: Is this a safety problem?
contact.safety.body: If you feel unsafe, leave and call the police or your security company first. Then tell us.

## Legal pages
legal.privacy.title: Privacy policy
legal.privacy.body: {{LEGAL_TEXT_PENDING}}
legal.terms.title: Terms and conditions
legal.terms.body: {{LEGAL_TEXT_PENDING}}
legal.updated: Last updated: [OWNER: date]

## Errors, empty states, 404
error.generic.title: Something went wrong on our side.
error.generic.body: Please try again in a minute. Reference: {reference}
error.not_found.title: We could not find that page.
error.not_found.body: Check the address, or go back home.
error.not_found.cta: Go home
error.offline.title: You seem to be offline.
error.offline.body: Check your connection and try again.
error.rate_limited: Too many tries. Please wait a few minutes and try again.
error.field.required: This field is required.
error.field.email: Enter an email address like name@example.com.
error.field.phone: Enter a cell number like 082 123 4567.
error.field.date_past: Choose a date and time in the future.
error.field.too_long: This is too long. Please shorten it.
empty.jobs.title: No jobs in your areas right now.
empty.jobs.body: We will show new ones here.
empty.requests.title: No requests yet.
empty.requests.body: When you request a helper, it will show here.
empty.activity.title: Nothing here yet.
empty.activity.body: Your past and upcoming jobs will show here.

## Host app: sign up, onboarding
host.signup.title: Create your account
host.signup.subtitle: Free for hosts.
host.signup.google: Continue with Google
host.signup.email: Continue with email
host.signup.terms: By continuing you agree to our Terms and Privacy policy.
host.login.title: Welcome back
host.login.stay: Keep me signed in on this device
host.onboarding.progress: Step {step} of {total}
host.onboarding.1.title: About you
host.onboarding.1.body: Your name and cell number help your helper reach you after your job is assigned.
host.onboarding.2.title: Your address
host.onboarding.2.body: Save it once. You can change it any time.
host.onboarding.2.access: Access notes (gate code, dogs, parking)
host.onboarding.3.title: Almost done
host.onboarding.3.body: Please read and agree to continue.
host.onboarding.done: You are all set.

## Host app: home and booking
host.home.greeting: Hi {firstName}
host.home.address: Cleaning at {address}
host.home.fast_picks: Fast picks
host.home.active_job: Your job
host.services.title: Services
host.services.search: Search services
host.book.title: Request a helper
host.book.type: What kind of clean?
host.book.type.standard: Standard clean
host.book.type.deep: Deep clean
host.book.type.turnover: Airbnb turnover
host.book.bedrooms: Bedrooms
host.book.bathrooms: Bathrooms
host.book.addons: Extras
host.book.addon.oven: Oven
host.book.addon.fridge: Fridge
host.book.addon.windows: Inside windows
host.book.addon.laundry: Laundry
host.book.addon.ironing: Ironing
host.book.addon.balcony: Balcony
host.book.when: Date and time
host.book.helpers: How many helpers?
host.book.pay: Pay per helper
host.book.pay_help: This is the recommended pay for the job. You can raise it, not lower it.
host.book.transport: Transport per helper
host.book.notes: Anything the helper should know?
host.book.total: Total
host.book.review: Review request
host.review.title: Review your request
host.review.submit: Confirm request
host.finding.title: Finding your helper
host.finding.offered: Offered first to {count} helpers near you
host.finding.timer: {minutes} minutes left in the first round
host.finding.open: Now open to all helpers near you
host.finding.cancel: Cancel request
host.finding.none.title: No helper yet
host.finding.none.body: You can raise the pay, change the time, or try again later.
host.finding.none.raise: Raise the pay
host.finding.none.time: Change the time
host.found.title: A helper accepted your request
host.found.code.title: Your check-in code
host.found.code.help: Give this code to your helper when they arrive.
host.found.message: Message your helper
host.found.cancel_note: You can cancel free of charge before your helper arrives. [OWNER: cancellation rules]
host.payment.title: Payment
host.jobday.assigned: Assigned
host.jobday.arrived: Helper has arrived
host.jobday.in_progress: In progress
host.jobday.finished: Finished
host.jobday.problem: Something wrong?
host.finish.title: Is the job done?
host.finish.confirm: Yes, the job is done
host.finish.report: Report a problem
host.lock.message: Confirm your last job to request another.

## Host app: account
host.account.title: Account
host.account.profile: Profile
host.account.addresses: Saved addresses
host.account.notifications: Notifications
host.account.payment_methods: Payment methods
host.account.legal: Legal
host.account.terms: Terms and conditions
host.account.privacy: Privacy policy
host.account.help: Help and contact
host.account.report: Report a problem
host.account.safety: Safety tips
host.account.sign_out_all: Sign out of all devices
host.account.delete: Delete my account
host.account.delete_note: We delete your profile. We keep records we must keep, like past jobs, without your name where we can.
host.nav.home: Home
host.nav.services: Services
host.nav.activity: Activity
host.nav.account: Account
host.activity.title: Activity
host.activity.upcoming: Upcoming
host.activity.past: Past
host.activity.book_again: Book again

## Helper app
helper.apply.title: Apply to be a helper
helper.apply.progress: Step {step} of {total}
helper.apply.1.title: About you
helper.apply.2.title: Your documents
helper.apply.2.body: We use these to check who you are. Only SIZA's admin sees them, and they are deleted 30 days after we decide.
helper.apply.2.id: South African ID (photo of the document)
helper.apply.2.selfie: A clear selfie
helper.apply.2.selfie_id: A selfie holding your ID
helper.apply.2.id_number: ID number
helper.apply.3.title: A reference
helper.apply.3.body: Someone we can call who knows your work.
helper.apply.4.title: Your public profile
helper.apply.4.consent: I agree to my public profile, the Terms and the Privacy policy.
helper.apply.age: You must be 18 or older to apply.
helper.apply.submit: Submit application
helper.pending.title: We are reviewing your application
helper.pending.body: We will contact you. You cannot see jobs until you are approved.
helper.jobs.title: Jobs
helper.jobs.offered_first: Offered to you first
helper.jobs.time_left: {time} left
helper.jobs.accept: Accept job
helper.jobs.taken: Another helper accepted this job first. New jobs appear here as they come in.
helper.jobs.you_receive: You receive R{amount} (pay and transport)
helper.jobs.address_hidden: The exact address is shared after you accept.
helper.mine.title: My jobs
helper.mine.checkin: Check in
helper.mine.code: Enter the host's check-in code
helper.mine.code_wrong: That code is not right. Check it and try again.
helper.mine.code_locked: Too many tries. Please wait 15 minutes.
helper.mine.finish: Finish job
helper.plan.title: Plan
helper.plan.first_free: Your first job is free
helper.plan.active: Active until {date}
helper.plan.ended: Your plan ended on {date}. Pay R{subscriptionPrice} to see new jobs.
helper.plan.pay: How to pay
helper.plan.reference: Use this payment reference: {reference}
helper.plan.note: We mark your payment once the money has cleared in our bank account.
helper.plan.reminder: Your plan ends in {days} days.
helper.account.title: Account
helper.account.available: I am available for jobs
helper.account.available_help: Turning this off has no penalty.
helper.account.preview: How hosts see you
helper.nav.jobs: Jobs
helper.nav.mine: My jobs
helper.nav.plan: Plan
helper.nav.account: Account

## Admin (labels only)
admin.nav.overview: Overview
admin.nav.helpers: Helpers
admin.nav.bookings: Bookings
admin.nav.reports: Reports
admin.nav.payments: Payments
admin.nav.settings: Settings
admin.nav.audit: Audit log
admin.helper.approve: Approve
admin.helper.decline: Decline
admin.helper.check.id_matches: ID matches the selfie
admin.helper.check.id_readable: ID is readable and valid
admin.helper.check.reference: Reference called
admin.helper.approve_blocked: Tick all three checks to approve.

## Emails (subject, body)
email.host.requested.subject: We got your request
email.host.requested.body: Hi {firstName}, we have your request for {service} on {date}. We are offering it to helpers near you now. We will email you when a helper accepts.
email.host.assigned.subject: Your helper is confirmed: {helperName}
email.host.assigned.body: Hi {firstName}, {helperName} will do your {service} on {date}. Your check-in code is {code}. Give it to {helperName} when they arrive.
email.host.no_helper.subject: No helper has accepted yet
email.host.no_helper.body: Hi {firstName}, nobody has accepted your request yet. You can raise the pay, change the time, or try again later.
email.helper.approved.subject: You are approved
email.helper.approved.body: Hi {firstName}, welcome to SIZA. You can now see and accept jobs. Your first completed job is free.
email.helper.declined.subject: About your application
email.helper.declined.body: Hi {firstName}, we cannot approve your profile right now. {reason}
email.helper.job_assigned.subject: Your job is confirmed
email.helper.job_assigned.body: Hi {firstName}, the job on {date} is yours. The address and the host's contact details are in your app.
email.helper.plan_reminder.subject: Your SIZA plan ends soon
email.helper.plan_reminder.body: Hi {firstName}, your plan ends on {date}. Pay R{subscriptionPrice} to keep seeing new jobs. Use the reference {reference}.
email.admin.new_request.subject: New request
email.admin.new_request.body: A new request is waiting. Reference: {reference}
