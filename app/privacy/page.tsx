import Link from "next/link";
import { SizaFooter } from "@/components/SizaFooter";
import { SizaHeader } from "@/components/SizaHeader";

export default function PrivacyPage() {
  return (
    <main className="siza-form-page">
      <SizaHeader />
      <article className="siza-shell siza-section-grid siza-section">
        <p className="siza-label">Privacy</p>
        <div>
          <h1 className="siza-form-title">Your information, handled <em>carefully.</em></h1>
          <div className="siza-body mt-12 grid gap-6">
            <p>This page is a launch placeholder. SIZA will publish the full privacy notice before collecting real identity documents or operating the marketplace publicly.</p>
            <p>Cleaner applications contain personal information and identity documents. These are stored privately and are accessible only to authorised SIZA administrators for the application review process.</p>
            <p>For privacy questions, contact SIZA through the contact details provided when the service launches.</p>
          </div>
          <Link className="siza-link" href="/">Back to SIZA <span aria-hidden="true">↗</span></Link>
        </div>
      </article>
      <SizaFooter />
    </main>
  );
}

