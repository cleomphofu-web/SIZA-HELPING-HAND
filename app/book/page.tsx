import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { SizaFooter } from "@/components/SizaFooter";
import { SizaHeader } from "@/components/SizaHeader";

export default function BookPage() {
  return (
    <main className="siza-form-page">
      <SizaHeader />
      <div className="siza-shell siza-form-layout">
        <Reveal delay={0.05}>
          <p className="siza-label">Booking request</p>
          <h1 className="siza-form-title">Tell us what <em>needs doing.</em></h1>
          <p className="siza-form-intro">Share your suburb, property details and preferred time. SIZA will use the request to match an approved cleaner.</p>
          <Link className="siza-link" href="/#how-it-works">Read how it works <span aria-hidden="true">↗</span></Link>
        </Reveal>

        <Reveal delay={0.15}>
          <form className="siza-form" action="/api/bookings" method="post">
            <div className="siza-field-grid">
              <div className="siza-field"><label htmlFor="fullName">Full name</label><input id="fullName" required name="fullName" autoComplete="name" /></div>
              <div className="siza-field"><label htmlFor="phone">Phone</label><input id="phone" required name="phone" type="tel" autoComplete="tel" placeholder="082 123 4567" /></div>
              <div className="siza-field"><label htmlFor="email">Email</label><input id="email" required name="email" type="email" autoComplete="email" /></div>
              <div className="siza-field"><label htmlFor="suburb">Suburb</label><input id="suburb" required name="suburb" autoComplete="address-level2" placeholder="Rosebank" /></div>
              <div className="siza-field siza-field-full"><label htmlFor="address">Full address</label><input id="address" required name="address" autoComplete="street-address" /></div>
              <div className="siza-field"><label htmlFor="propertyType">Property type</label><select id="propertyType" required name="propertyType" defaultValue=""><option value="" disabled>Select one</option><option value="studio">Studio</option><option value="1-bed">1-bed</option><option value="2-bed">2-bed</option><option value="3-bed">3-bed</option><option value="office">Office</option><option value="other">Other</option></select></div>
              <div className="siza-field"><label htmlFor="startAt">Start date and time</label><input id="startAt" required name="startAt" type="datetime-local" /></div>
              <div className="siza-field"><label htmlFor="endAt">Expected end time</label><input id="endAt" required name="endAt" type="datetime-local" /></div>
              <div className="siza-field siza-field-full"><label htmlFor="accessNotes">Access instructions</label><textarea id="accessNotes" name="accessNotes" rows={4} placeholder="Parking, keys, entry details" /></div>
              <div className="siza-field siza-field-full"><label htmlFor="notes">Anything else we should know?</label><textarea id="notes" name="notes" rows={3} /></div>
            </div>
            <input className="hidden" name="honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <p className="siza-payment-disclosure">Payment is arranged directly with your cleaner after the job. SIZA does not hold funds or cover payment disputes.</p>
            <label className="siza-consent"><input required name="consent" type="checkbox" /> <span>I agree to the terms and privacy notice.</span></label>
            <button className="siza-button" type="submit">Request a clean <span aria-hidden="true">↗</span></button>
          </form>
        </Reveal>
      </div>
      <SizaFooter />
    </main>
  );
}

