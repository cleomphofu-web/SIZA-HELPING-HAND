# SIZA copy deck (single source of all words on the site)

**How this file works.** One line per piece of text: `key: text`. Lines starting with `#`, `>` or blank are ignored by the build. Run `npm run build:copy` to generate `src/content/copy.generated.ts` (never edit that file, never type site text in components). Variables in `{braces}` are filled by code: `{supportEmail}`, `{whatsappUrl}`, `{subscriptionPrice}`, `{subscriptionDays}`, `{year}`, `{firstName}`, `{areas}` and the per-key ones named in the text.
**Rules (checked by the build).** Words per `siza-brand-voice-and-copy`. Banned anywhere: guarantee, insured, background check, secure payment, escrow, 100% safe, "you choose". The word "vetted" and the ID-check claims live only in keys starting `claim.`, which the site shows only when the matching switch is on (set when the code enforces it). `[OWNER: ...]` and `[CONFIRM: ...]` mark facts only the owner can supply: the build lists them and, in strict mode (production), fails until they are resolved. No invented numbers, people, quotes or reviews.
**Terms.** helper (never "cleaner" in the product), host, request, assigned, check-in code. Voice: plain, warm, direct; short sentences.

## Site-wide
site.name: siZa.
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

## Public holding page
holding.title: SIZA is coming to {areas}.
holding.body: Help for your home and fair work for helpers. We are getting ready to open.
holding.contact: Questions? Email {supportEmail}.

## Public hero words
public.hero.about: ABOUT
public.hero.services: SERVICES
public.hero.how: HOW IT WORKS
public.hero.request: REQUEST
public.hero.apply: APPLY
public.hero.contact: CONTACT

## Accounts and Phase A actions
account.signup.title: Create your SIZA account
account.signup.body: Continue with the details we need to set up your account.
account.login.title: Log in to SIZA
account.login.body: Use the email and password you signed up with.
account.login.challenge: Complete the security check, then try signing in again.
account.role.host: I need help at home
account.role.helper: I want to work as a helper
account.label.first_name: First name
account.label.last_name: Surname
account.label.email: Email address
account.label.password: Password
account.label.phone: Cell number
account.label.role: I am here to
account.label.terms: I agree to the Terms and conditions.
account.label.privacy: I agree to the Privacy policy.
account.label.turnstile: Verification
account.notice: Your information is used to set up your account and manage your SIZA requests.
account.success: Your account request was received. Check your email for a confirmation link if asked, then log in.
account.error: We could not complete that request. Check your details and try again.
account.turnstile.unavailable: Turnstile is not configured. Account actions are unavailable until it is set up.
button.sending: Sending…
phase_a.no_access: This area is for signed-in SIZA members.
phase_a.empty_requests: No requests yet. Request a helper to get started.
phase_a.empty_jobs: No jobs in your areas right now. New offers will appear here.
phase_a.subscription_required: Your first completed job is free. A current subscription is needed before you accept later jobs.
phase_a.report.title: Report a problem
phase_a.report.body: Tell us what happened. An admin will review the report.
phase_a.report.booking_required: Open a request to report a problem about that job.
phase_a.check_in.title: Enter the check-in code
phase_a.check_in.body: Ask the host for the six-digit code when you arrive.
host.onboarding.title: Tell us where you need help
host.onboarding.body: Save your usual details once, then use them when you make a request.
host.profile.title: Your profile
host.account.contact.title: Your contact details
host.account.contact.body: Use your name and cell number to manage your SIZA account.
host.account.contact.phone_not_verified: Changes to your cell number are not verified with a code yet.
host.account.contact.saved: Your contact details have been saved.
host.account.contact.failed: We could not save these details. Check them and try again.
host.account.contact.rate_limited: Please wait before trying again.
host.label.address: Address
host.label.suburb: Suburb
host.label.city: City
host.label.notes: Access notes
host.book.body: Tell us what you need. We calculate the guide from the service and area settings.
host.label.helpers_needed: Helpers needed
host.label.start: Start time
host.label.idempotency: Request reference
host.requests.title: Your requests
host.requests.body: Select a request to see its details and current status.
host.requests.view: View request
host.app.title: Your SIZA requests
host.app.body: Create a request, see its status and report a problem when you need to.
helper.app.title: Your helper work
helper.app.body: See offers in your areas and keep your profile up to date.
host.request.address: Assigned address
host.request.assigned: Assigned helpers
host.request.helper_phone: Your helper
host.request.report: Report this booking
host.request.issue_code: Show check-in code
host.request.scheduled: Scheduled
host.request.pay_per_helper: Pay per helper
host.request.transport: Transport per helper
host.request.load_error.title: We could not load this request
helper.onboarding.title: Build your helper profile
helper.onboarding.body: Your profile stays pending until the owner completes the approval checks.
helper.label.date_of_birth: Date of birth
helper.label.job_title: Job title
helper.label.services: Services
helper.label.suburbs: Suburbs you serve
helper.label.bio: Short bio
helper.label.experience: Experience
helper.label.rate: Rate note
helper.label.id_number: ID number
helper.label.id_photo: ID photo
helper.label.selfie_check: Selfie check photo
helper.label.services_hint: Services, separated by commas
helper.label.suburbs_hint: Suburbs, separated by commas
helper.label.consent: I agree that my profile can be shown to hosts under the Privacy policy.
helper.job.accept: Accept this job
helper.job.check_in: Check in
phase_a.report.category: Category
phase_a.report.no_show: No-show
phase_a.report.safety: Safety
phase_a.report.payment: Payment
phase_a.report.conduct: Conduct
phase_a.report.other: Other
phase_a.report.what_happened: What happened
phase_a.error: Something went wrong on our side. Try again in a minute.
host.request.no_show: Report a no-show
host.request.no_show_resolution.title: This helper did not arrive
host.request.no_show_resolution.body: This slot has been open for {minutes} minutes. You can continue with fewer helpers or close this vacant slot. Other helpers keep their jobs.
host.request.no_show_resolution.body_close_only: This slot has been open for {minutes} minutes. No other helpers remain assigned. Closing it will cancel the request.
host.request.no_show_resolution.waiting: You can choose what to do after {minutes} minutes. Refresh this page then.
host.request.no_show_resolution.proceed: Continue with fewer helpers
host.request.no_show_resolution.close: Close vacant slot
host.request.no_show_resolution.done_proceed: You chose to continue with fewer helpers. Other helpers keep their jobs.
host.request.no_show_resolution.done_close: You closed this vacant slot. Other helpers keep their jobs.
host.request.no_show_resolution.error: We could not save this choice. Refresh the page and try again.

## Mandatory notices (word for word)
notice.outside: Agreements made outside SIZA are not SIZA's responsibility.
notice.address: Your address is shared with the helper(s) assigned to you.
notice.payment.phase_a: Payment is arranged directly between you and the helper after the job. SIZA does not hold funds or cover payment disputes.
notice.payment.phase_b: In Phase B, card payments are securely authorized in advance and held by our licensed payment provider until completion is confirmed by both host and helper. SIZA ensures fair release and transparent dispute mediation.
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
faq.5.a: You can cancel free of charge before a helper is assigned and until 4 hours before the job starts after assignment. Later cancellations, or nobody answering the door, mean you owe the helper the transport amount directly. If a helper does not arrive, you owe nothing.
faq.6.q: What can helpers do?
faq.6.a: Helpers do the job you booked. Handyman jobs exclude electrical, plumbing, gas, roofing and structural work.
faq.7.q: Which areas do you serve?
faq.7.a: We are recruiting in Sandton, Rosebank, Bryanston, Vanderbijlpark and Vereeniging. A suburb opens for host requests only when at least 3 helpers there are approved.
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
faq.13.a: We collect only the information required to verify your identity and coordinate bookings. ID photos and selfies are stored in secure private storage, accessed exclusively by authorized administrators, and permanently deleted 30 days after an application decision. A secure cryptographic hash of your ID is retained to prevent duplicate accounts in accordance with POPIA.
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
about.hero.title: Help, made fair.
about.hero.subtitle: *(A MARKETPLACE FOR GOOD WORK AND TRUSTED HELP)
about.hero.body: SIZA connects people who need a hand with helpers who do good work, in {areas}.
about.name.label: THE NAME //
about.why.label: WHY WE EXIST //
about.why.title: TWO SIDES OF ONE DOOR
about.why.note: An everyday story
about.why.host: Check-out is at 10:00. The next guests arrive at 14:00. The person you trusted just cancelled. You open your phone and start searching.
about.why.helper: You are good at this work. Good work is hard to find, and fair work is harder. Half your day goes on getting there. Nobody remembers who always shows up.
about.why.bridge: SIZA is the door between them: clear prices, fair turns, and proof that the right person arrived. We bridge the gap so quality work is respected and homes receive reliable help.
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
about.where.body: We are recruiting in Sandton, Rosebank, Bryanston, Vanderbijlpark and Vereeniging. A suburb opens for host requests only when at least 3 helpers there are approved.
about.where.notify: Not in your suburb yet? Tell us and we will tell you when we arrive.
about.limits.label: WHAT WE DO NOT DO (YET) //
about.limits.today.title: Today
about.limits.today.1: SIZA does not hold your money. You pay your helper directly after the job.
about.limits.today.2: SIZA does not replace your own home or business cover. SIZA does not currently provide insurance.
about.limits.coming.title: Coming
about.limits.coming.1: Protected card payments
about.limits.coming.2: Reviews and ratings
about.limits.coming.3: More services
about.limits.closing: We would rather tell you what we cannot do yet than promise what we cannot prove.
about.people.label: THE PEOPLE //
about.people.founder.name: IKAMVA AUTOMATIONS
about.people.founder.role: Founder
about.people.founder.story: Built to bring dignity, fairness, and modern technology to everyday home and short-stay services across South Africa.
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
apply.earn.body: Your pay and transport are shown on every job before you accept. SIZA takes no commission from them. For example, a 4-hour home clean at R100/hour plus R50 transport pays you R450 in full directly from the host.
apply.cost.title: What it costs
apply.cost.body: Joining is free. After your first completed job, SIZA costs R{subscriptionPrice} for {subscriptionDays} days. You pay on purpose, never by debit order.
apply.need.title: What you need
apply.need.1: A South African ID
apply.need.2: A clear selfie, and a selfie holding your ID
apply.need.3: A cell number
apply.need.4: One reference we can call
apply.need.5: You must be 18 or older
apply.after.title: What happens next
apply.after.body: We review your application within 5 working days.
apply.cta: Start your application
apply.login: Already applied? Log in

## Contact page
contact.hero.label: CONTACT //
contact.hero.title: Ask us anything.
contact.hero.subtitle: *(WE READ EVERY MESSAGE)
contact.hero.body: Mon to Sat, 07:00 to 18:00. We aim to reply within 4 hours. Email {supportEmail} or message us on WhatsApp.
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
legal.privacy.body: SIZA processes personal information in accordance with the Protection of Personal Information Act (POPIA). We collect names, contact details, service addresses, and identification documents solely for authentication, safety vetting, and service fulfillment. ID documents are stored in private storage, accessible only by verified administrators, and permanently erased 30 days after an application decision. A cryptographic one-way hash of identity numbers is retained solely to prevent duplicate applications. Addresses and contact details are disclosed strictly between assigned participants after a confirmed booking. We never sell or monetize personal data.
legal.terms.title: Terms and conditions
legal.terms.body: By accessing or using SIZA, you agree to these terms. SIZA operates as a matching platform connecting independent helpers with hosts. In Phase A, agreements and payments for services are made directly between the host and helper; SIZA does not hold customer funds and does not act as an employer. SIZA does not provide insurance cover and users should maintain adequate property and business insurance. Users agree to provide truthful information and adhere to mutual standards of safety, respect, and punctuality.
legal.updated: Last updated: 29 October 2026

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
host.preview.kicker: HOST HOME DRAFT
host.preview.title: What can we help with?
host.preview.notice: Preview only. Your choices stay in this browser and nothing is sent or saved.
host.preview.location: Where do you need help?
host.preview.location_placeholder: Choose a suburb
host.preview.services: Choose a service
host.preview.home_cleaning: Home cleaning
host.preview.turnover: Airbnb turnover
host.preview.schedule: When should the helper come?
host.preview.date: Date
host.preview.time: Time
host.preview.property_type: Home type (optional)
host.preview.property_type_help: This helps with access only. It does not change the recommended pay.
host.preview.house: House
host.preview.flat: Flat
host.preview.complex: Complex
host.preview.home_details: Home details
host.preview.pay: Recommended pay
host.preview.pay_pending: Shown after service and area details
host.preview.pay_help: SIZA calculates the guide from the service and area settings. You can raise it, not lower it.
host.preview.preference: Helper preference
host.preview.any: Any
host.preview.female: Female
host.preview.male: Male
host.preview.mix: Mix
host.preview.review: Preview request
host.preview.local_result: Preview only. No request was sent or saved.
host.preview.nav_label: Host navigation preview
host.preview.nav_home: Home
host.preview.nav_services: Services
host.preview.nav_activity: Activity
host.preview.nav_account: Account
host.preview.production_unavailable: This design preview is available only during local development.
host.home.greeting: Hi {firstName}
host.home.address: Cleaning at {address}
host.home.fast_picks: Fast picks
host.home.active_job: Your job
host.home.recent_requests: Recent requests
host.home.loading: Loading your requests…
host.home.empty_requests: No requests yet. Start by telling us what you need.
host.home.view_requests: View all requests
host.home.carousel.title: Homes cared for with pride
host.home.carousel.subtitle: Real spaces refreshed by trusted local helpers across Johannesburg.
host.home.impact.title: Every request changes a household
host.home.impact.body: When you book on SIZA, your helper keeps their earnings and transport. Your request brings reliable, dignified income directly to hardworking individuals providing for their families.
host.home.status.open: Looking for a helper
host.home.status.assigned: Helper confirmed
host.home.status.in_progress: Job in progress
host.home.status.completed: Completed
host.home.status.cancelled: Cancelled
host.home.status.disputed: Needs attention
host.home.status.expired: Expired
button.retry: Try again
host.services.title: Services
host.services.search: Search services
host.book.title: Request a helper
host.book.type: What kind of clean?
host.book.type.standard: Standard clean
host.book.type.deep: Deep clean
host.book.type.turnover: Airbnb turnover
host.book.bedrooms: Bedrooms
host.book.bathrooms: Bathrooms
host.book.size_band: Home size
host.book.size_band.small: Small
host.book.size_band.medium: Medium
host.book.size_band.large: Large
host.book.services: Services for this request
host.book.gender: Helper preference
host.book.gender.any: No preference
host.book.gender.female: Female helpers
host.book.gender.male: Male helpers
host.book.gender.mix: A mixed team
host.book.gender.help: This is the only personal preference used for ranking. Fair workload comes first; it only helps rank ties. Every otherwise eligible helper can still be offered the job.
host.book.estimate.duration: Estimated time: {hours} hr {minutes} min
host.book.estimate.pay: Recommended pay per helper: {amount}
host.book.estimate.unavailable: This service or area is not open for requests yet.
host.book.error.rate_limited: Please wait before sending another request.
host.book.error.validation: Check the details and try again.
host.book.error.verify: We could not verify this request. Please try again.
host.book.error.not_open: This service or area is not open for requests yet.
host.book.error.check_existing: We could not check your existing request. Try again in a minute.
host.book.error.check_previous: We could not check your previous requests. Try again in a minute.
host.book.error.prepare_offers: We could not prepare the helper offers. Try again in a minute.
host.book.error.pricing: Pay and transport cannot be below the amounts shown.
host.book.error.amount_floor: Pay or transport is below the minimum for this request.
host.book.error.failed: We could not save your request. Try again in a minute.
host.book.transport.help: Leave this blank to use the suggested transport amount.
host.book.pay.help: Leave this blank to use the recommended pay. You can raise it; the minimum is shown here.
host.book.pay.minimum: Minimum pay per helper: {amount}
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
host.book.transport: Transport per helper
host.book.notes: Anything the helper should know?
host.book.total: Total
host.book.review: Review request
host.review.title: Review your request
host.review.services: Services
host.review.start: Date and time
host.review.helpers: Helpers
host.review.preference: Helper preference
host.review.pay: Pay per helper
host.review.transport: Transport per helper
host.review.estimate: Estimated time
host.review.total: Total for all helpers
host.review.edit: Edit request
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
host.found.cancel_note: You can cancel free of charge before a helper is assigned and until 4 hours before the job starts after assignment. Later cancellations, or nobody answering the door, mean you owe the helper the transport amount directly. If a helper does not arrive, you owe nothing.
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
helper.apply.error.uncertain: We could not confirm whether your application was saved. Check your application before sending it again.
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
helper.matching.title: Optional matching preference
helper.matching.body: You can choose one optional preference for how job offers are ranked. Leave it at no preference if you do not want to share this information.
helper.matching.choice: Preference
helper.matching.none: No preference
helper.matching.female: Prefer female helpers
helper.matching.male: Prefer male helpers
helper.matching.consent: I choose to share this preference for job offer ranking.
helper.matching.privacy: hosts will not see this choice. It only breaks ties after fair workload ranking; you can still be offered other jobs. No other personal details are used to match or rank helpers. You can change or clear it at any time.
helper.matching.saved: Your preference has been saved.
helper.matching.failed: We could not save this setting. Check your choice and try again.
helper.matching.rate_limited: Please wait before changing this setting again.
helper.matching.unavailable: The optional preference is not available yet. We are reviewing the privacy notice.
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
admin.overview.eyebrow: SIZA / admin / overview
admin.overview.title: Marketplace snapshot
admin.overview.intro: These counts refresh when you open or reload this page. They do not show who is online right now.
admin.overview.metric.hosts: Registered hosts
admin.overview.metric.helpers_pending: Pending helper applications
admin.overview.metric.helpers_approved: Approved helpers
admin.overview.metric.helpers_declined: Declined helpers
admin.overview.metric.helpers_suspended: Suspended helpers
admin.overview.metric.requests_open: Open requests
admin.overview.metric.requests_assigned: Assigned requests
admin.overview.metric.jobs_in_progress: Jobs in progress
admin.overview.metric.jobs_completed: Completed jobs
admin.overview.metric.reports_open: Reports to review
admin.overview.queues: Work queues
admin.overview.queue.helpers: Review helper applications
admin.overview.queue.bookings: Review requests
admin.overview.queue.reports: Review reports
admin.overview.error.title: The overview could not load
admin.overview.error.body: We could not read these counts. Try reloading the page.
admin.overview.retry: Reload overview
admin.overview.loading: Loading the admin overview
admin.mfa.title: Protect your admin account
admin.mfa.setup.body: Add an authenticator app to your admin account. You will need its six-digit code each time you sign in.
admin.mfa.setup.button: Show setup key
admin.mfa.secret.label: Authenticator setup key
admin.mfa.secret.help: Add this key to your authenticator app, then enter the six-digit code it gives you.
admin.mfa.challenge.body: Enter the six-digit code from your authenticator app.
admin.mfa.code.label: Authenticator code
admin.mfa.submit: Verify code
admin.mfa.cancel: Sign out
admin.mfa.error: We could not verify that code. Check it and try again.
admin.mfa.setup.error: We could not start authenticator setup. Try again.
admin.login.title: Sign in.
admin.login.email: Email
admin.login.password: Password
admin.login.submit: Sign in
admin.login.error.invalid: Those sign-in details were not accepted. Check them and try again.
admin.login.error.try_again: We could not check sign-in just now. Please try again.
admin.audit.home.summary: Review a record of changes made in the app.
admin.audit.eyebrow: SIZA / admin / audit log
admin.audit.title: Recent admin activity
admin.audit.intro: See changes recorded by SIZA. This list does not show live errors.
admin.audit.action: Recorded action
admin.audit.entity: Record type
admin.audit.time: When
admin.audit.list: Recorded admin activity
admin.audit.empty: No recorded admin activity yet.
admin.audit.error: The audit log could not be loaded. Try again.
admin.audit.invalid: This audit page link is invalid. Start from the latest activity.
admin.audit.retry: Try again
admin.audit.loading: Loading audit activity
admin.audit.older: Older activity
admin.audit.newest: Back to latest
admin.audit.action.helper_approved: Helper application approved
admin.audit.action.helper_declined: Helper application declined
admin.audit.action.helpers_assigned: Helpers assigned to a request
admin.audit.action.booking_assigned: Request assigned
admin.audit.action.booking_cancelled: Request cancelled
admin.audit.action.booking_completed: Request completed
admin.audit.action.booking_disputed: Request under review
admin.audit.action.booking_expired: Request expired
admin.audit.action.booking_in_progress: Request in progress
admin.audit.action.booking_open: Request reopened
admin.audit.action.check_in_code_locked: Check-in code attempts locked
admin.audit.action.helper_no_show: Helper marked as a no-show
admin.audit.action.unknown: Other recorded change
admin.audit.entity.helper_details: Helper application
admin.audit.entity.phase_a_bookings: Booking request
admin.audit.entity.booking_assignments: Helper assignment
admin.audit.entity.unknown: SIZA record
admin.helper.approve: Approve
admin.helper.decline: Decline
admin.helper.check.id_matches: ID matches the selfie
admin.helper.check.id_readable: ID is readable and valid
admin.helper.check.reference: Reference called
admin.helper.approve_blocked: Tick all three checks to approve.
admin.settings.title: Marketplace settings
admin.settings.eyebrow: SIZA / admin / settings
admin.settings.intro: Changes take effect immediately. All prices are in South African rand.
admin.settings.rate_card.title: Service rates
admin.settings.rate_card.service: Service
admin.settings.rate_card.hourly: Hourly rate (R)
admin.settings.rate_card.bedroom: Minutes per bedroom
admin.settings.rate_card.bathroom: Minutes per bathroom
admin.settings.rate_card.save: Save rate
admin.settings.rate_card.saved: Rate saved
admin.settings.rate_card.error: Could not save rate. Try again.
admin.settings.transport.title: Transport zones
admin.settings.transport.suburb: Suburb
admin.settings.transport.region: Region
admin.settings.transport.zone: Zone
admin.settings.transport.cents: Transport (R)
admin.settings.transport.enabled: Active
admin.settings.transport.save: Save zone
admin.settings.transport.saved: Zone saved
admin.settings.transport.error: Could not save zone. Try again.
admin.settings.config.title: Operational settings
admin.settings.config.offer_window_minutes: Offer window (minutes)
admin.settings.config.no_show_minutes: No-show window (minutes after start)
admin.settings.config.check_in_lock_minutes: Check-in lock after 5 failed attempts (minutes)
admin.settings.config.id_doc_retention_days: ID document retention (days)
admin.settings.config.check_in_expiry_hours: Check-in code expiry (hours)
admin.settings.config.confirm_grace_hours: Host confirmation grace period (hours)
admin.settings.config.auto_release_hours: Auto-release after end (hours)
admin.settings.config.save: Save setting
admin.settings.config.saved: Setting saved
admin.settings.config.error: Could not save setting. Try again.
admin.settings.error.title: Settings unavailable
admin.settings.error.body: The settings could not be loaded. Please reload the page.
admin.overview.queue.settings: Rates, zones and operational settings

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
email.helper.declined.body: Hi {firstName}, we cannot approve your profile right now. Please check your account for an update.
email.helper.job_assigned.subject: Your job is confirmed
email.helper.job_assigned.body: Hi {firstName}, the job on {date} is yours. The address and the host's contact details are in your app.
email.helper.plan_reminder.subject: Your SIZA plan ends soon
email.helper.plan_reminder.body: Hi {firstName}, your plan ends on {date}. Pay R{subscriptionPrice} to keep seeing new jobs. Use the reference {reference}.
email.admin.new_request.subject: New request
email.admin.new_request.body: A new request is waiting in the admin area.
email.admin.new_application.subject: New helper application
email.admin.new_application.body: A helper application is ready for review in the admin area.
