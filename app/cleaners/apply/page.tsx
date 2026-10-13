import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { SizaFooter } from "@/components/SizaFooter";
import { SizaHeader } from "@/components/SizaHeader";

export default function CleanerApplyPage() {
  return (
    <main className="siza-form-page">
      <SizaHeader />
      <div className="siza-shell siza-form-layout">
        <Reveal delay={0.05}>
          <p className="siza-label">Cleaner application</p>
          <h1 className="siza-form-title">Your work.<br /><em>Your rates.</em></h1>
          <p className="siza-form-intro">The application is reviewed by SIZA. Have your details, documents and two references ready before you start.</p>
          <div className="siza-checklist">
            <div className="siza-check"><span className="siza-check-number">01</span><span>Your details</span><span aria-hidden="true">→</span></div>
            <div className="siza-check"><span className="siza-check-number">02</span><span>Documents</span><span aria-hidden="true">→</span></div>
            <div className="siza-check"><span className="siza-check-number">03</span><span>References</span><span aria-hidden="true">→</span></div>
          </div>
          <Link className="siza-link" href="/#how-it-works">See the host experience <span aria-hidden="true">↗</span></Link>
        </Reveal>

        <Reveal delay={0.15}>
          <form className="siza-form" action="/api/cleaners/apply" method="post" encType="multipart/form-data">
            <div className="siza-field-grid">
              <div className="siza-field"><label htmlFor="fullName">Full name</label><input id="fullName" required name="fullName" autoComplete="name" /></div>
              <div className="siza-field"><label htmlFor="phone">Phone</label><input id="phone" required name="phone" type="tel" autoComplete="tel" placeholder="082 123 4567" /></div>
              <div className="siza-field"><label htmlFor="email">Email</label><input id="email" required name="email" type="email" autoComplete="email" /></div>
              <div className="siza-field"><label htmlFor="suburbs">Suburbs served</label><input id="suburbs" required name="suburbs" placeholder="Rosebank, Parkhurst" /></div>
              <div className="siza-field"><label htmlFor="services">Services offered</label><select id="services" required name="services" defaultValue=""><option value="" disabled>Select one to start</option><option value="home">Home</option><option value="airbnb_turnover">Airbnb turnover</option><option value="office">Office</option><option value="post_construction">Post-construction</option><option value="move_out">Move-out</option></select></div>
              <div className="siza-field"><label htmlFor="rateAmount">Your rate</label><input id="rateAmount" required name="rateAmount" type="number" min="0" step="0.01" placeholder="0.00" /></div>
              <div className="siza-field"><label htmlFor="rateUnit">Rate unit</label><select id="rateUnit" required name="rateUnit" defaultValue=""><option value="" disabled>Select one</option><option value="per_hour">Per hour</option><option value="per_job">Per job</option></select></div>
              <div className="siza-field siza-field-full"><label htmlFor="idNumber">ID or passport number</label><input id="idNumber" required name="idNumber" /></div>
            </div>

            <fieldset className="siza-fieldset">
              <legend>Upload documents</legend>
              <div className="siza-field-grid">
                <div className="siza-field"><label htmlFor="profilePhoto">Profile photo</label><input id="profilePhoto" required name="profilePhoto" type="file" accept="image/jpeg,image/png,image/webp" /></div>
                <div className="siza-field"><label htmlFor="selfieId">Selfie holding your ID</label><input id="selfieId" required name="selfieId" type="file" accept="image/jpeg,image/png,image/webp" /></div>
                <div className="siza-field"><label htmlFor="idDocument">ID document or passport</label><input id="idDocument" required name="idDocument" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" /></div>
                <div className="siza-field"><label htmlFor="proofOfAddress">Proof of address</label><input id="proofOfAddress" required name="proofOfAddress" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" /></div>
              </div>
            </fieldset>

            <fieldset className="siza-fieldset">
              <legend>Two references</legend>
              <div className="siza-field-grid">
                <div className="siza-field"><label htmlFor="referenceOneName">Reference one name</label><input id="referenceOneName" required name="referenceOneName" /></div>
                <div className="siza-field"><label htmlFor="referenceOnePhone">Reference one phone</label><input id="referenceOnePhone" required name="referenceOnePhone" type="tel" /></div>
                <div className="siza-field"><label htmlFor="referenceTwoName">Reference two name</label><input id="referenceTwoName" required name="referenceTwoName" /></div>
                <div className="siza-field"><label htmlFor="referenceTwoPhone">Reference two phone</label><input id="referenceTwoPhone" required name="referenceTwoPhone" type="tel" /></div>
              </div>
            </fieldset>

            <div className="siza-field"><label htmlFor="availability">Tell us about your availability</label><textarea id="availability" required name="availability" rows={3} placeholder="Areas, days and times you normally work" /></div>
            <input className="hidden" name="honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <p className="siza-payment-disclosure">At launch, payment is arranged directly between you and the cleaner after the job. SIZA does not hold funds or cover payment disputes.</p>
            <label className="siza-consent"><input required name="consent" type="checkbox" /> <span>I agree to data processing under POPIA and to the terms.</span></label>
            <button className="siza-button" type="submit">Start application <span aria-hidden="true">↗</span></button>
          </form>
        </Reveal>
      </div>
      <SizaFooter />
    </main>
  );
}
