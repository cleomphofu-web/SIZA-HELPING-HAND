"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import FramerEffects from "@/components/framer/utils/FramerEffects";
import LayoutIsland from "@/components/framer/utils/LayoutIsland";
import useStripFramerStyles from "@/components/framer/utils/useStripFramerStyles";

const Subtext1 = dynamic(() => import("@/components/framer/subtext-01").then((module) => module.default), { ssr: false });
const Subtext2 = dynamic(() => import("@/components/framer/subtext-02").then((module) => module.default), { ssr: false });
const Subtext3 = dynamic(() => import("@/components/framer/subtext-03").then((module) => module.default), { ssr: false });
const Subtext4 = dynamic(() => import("@/components/framer/subtext-04").then((module) => module.default), { ssr: false });
const Subtext5 = dynamic(() => import("@/components/framer/subtext-05").then((module) => module.default), { ssr: false });
const Subtext6 = dynamic(() => import("@/components/framer/subtext-06").then((module) => module.default), { ssr: false });
const Subtext7 = dynamic(() => import("@/components/framer/subtext-07").then((module) => module.default), { ssr: false });
const WorkCards = [
  dynamic(() => import("@/components/framer/work-card-01").then((module) => module.default), { ssr: false }), dynamic(() => import("@/components/framer/work-card-02").then((module) => module.default), { ssr: false }), dynamic(() => import("@/components/framer/work-card-03").then((module) => module.default), { ssr: false }),
  dynamic(() => import("@/components/framer/work-card-04").then((module) => module.default), { ssr: false }), dynamic(() => import("@/components/framer/work-card-05").then((module) => module.default), { ssr: false }), dynamic(() => import("@/components/framer/work-card-06").then((module) => module.default), { ssr: false }),
  dynamic(() => import("@/components/framer/work-card-07").then((module) => module.default), { ssr: false }), dynamic(() => import("@/components/framer/work-card-08").then((module) => module.default), { ssr: false }), dynamic(() => import("@/components/framer/work-card-09").then((module) => module.default), { ssr: false }),
];
const ProjectCards = [
  dynamic(() => import("@/components/framer/project-card-01").then((module) => module.default), { ssr: false }), dynamic(() => import("@/components/framer/project-card-02").then((module) => module.default), { ssr: false }), dynamic(() => import("@/components/framer/project-card-03").then((module) => module.default), { ssr: false }),
  dynamic(() => import("@/components/framer/project-card-04").then((module) => module.default), { ssr: false }), dynamic(() => import("@/components/framer/project-card-05").then((module) => module.default), { ssr: false }), dynamic(() => import("@/components/framer/project-card-06").then((module) => module.default), { ssr: false }),
];
const JourneyCards = [dynamic(() => import("@/components/framer/journey-card-01").then((module) => module.default), { ssr: false }), dynamic(() => import("@/components/framer/journey-card-02").then((module) => module.default), { ssr: false }), dynamic(() => import("@/components/framer/journey-card-03").then((module) => module.default), { ssr: false })];
const BlogCards = [dynamic(() => import("@/components/framer/blog-card-01").then((module) => module.default), { ssr: false }), dynamic(() => import("@/components/framer/blog-card-02").then((module) => module.default), { ssr: false }), dynamic(() => import("@/components/framer/blog-card-03").then((module) => module.default), { ssr: false })];
const Video = dynamic(() => import("@/components/framer/video-js-video-01").then((module) => module.Video), { ssr: false });
const PreLoader = dynamic(() => import("@/components/framer/pre-loader-01").then((module) => module.default), { ssr: false });
const FaqShell = dynamic(() => import("@/components/framer/faq-tab-01").then((module) => module.default), { ssr: false });
const FormButtonShell = dynamic(() => import("@/components/framer/form-button-01").then((module) => module.default), { ssr: false });

const placeholder = "/placeholders/approved-media-needed.svg";
const work = [
  ["01", "Share your details", "Tell SIZA where you work, the services you offer and how to reach you."],
  ["02", "Upload your documents", "Provide the required identity and address documents, plus a selfie holding your ID."],
  ["03", "Add two references", "Give us two references so SIZA can call both before an approval decision."],
  ["04", "ID matches selfie", "SIZA checks that the ID document matches the selfie submitted with the application."],
  ["05", "ID is readable", "SIZA checks that the identity document is clear enough to review."],
  ["06", "Both references called", "SIZA phones both supplied references before a cleaner can be called vetted."],
  ["07", "Request a clean", "Hosts share their suburb, property details and preferred time."],
  ["08", "SIZA reviews the request", "SIZA uses the request to match an approved cleaner serving the needed area and service."],
  ["09", "Arrange payment directly", "Cleaners set their own rates and payment is arranged directly after the job."],
];
const services = [
  ["Homes", "Johannesburg", "Home cleaning"], ["Short stays", "Johannesburg", "Turnover support"], ["Offices", "Johannesburg", "Office cleaning"],
  ["Move-outs", "Johannesburg", "Move-out cleaning"], ["Post-construction", "Johannesburg", "Post-construction"], ["Flexible requests", "Johannesburg", "Tell us what is needed"],
];
const faqs = [
  ["What does vetted mean?", "A cleaner is called vetted only once SIZA has confirmed the ID matches the submitted selfie, the ID is readable, and both supplied references have been phoned."],
  ["How does payment work?", "At launch, payment is arranged directly between you and the cleaner after the job. SIZA does not hold funds or cover payment disputes."],
  ["Do cleaners set their own rates?", "Yes. Cleaners set their own rates and can describe whether their rate is per hour or per job in their application."],
  ["Where is SIZA available?", "SIZA is launching in Johannesburg and is onboarding its first cleaners. Availability depends on the suburbs and services each approved cleaner provides."],
];

function RuntimeStyleFixes() {
  useStripFramerStyles(".framer-1pg34wb", ["background", "backdrop-filter", "-webkit-backdrop-filter"]);
  return null;
}

function FramerItem({ children }: { children: React.ReactNode }) {
  return <LayoutIsland><div className="framer-item">{children}</div></LayoutIsland>;
}

export default function FramerPublic() {
  return (
    <main className="framer-public">
      <FramerEffects />
      <RuntimeStyleFixes />
      <header className="framer-nav">
        <Link className="framer-wordmark" href="/" aria-label="SIZA home">siZa<span aria-hidden="true">.</span></Link>
        <nav aria-label="Main navigation"><Link href="#apply-title">Apply</Link><Link href="#host-title">For hosts</Link><Link href="#faq-title">Questions</Link><Link href="/privacy">Privacy</Link></nav>
        <Link className="framer-nav-action" href="/book">Request a clean <span aria-hidden="true">↗</span></Link>
      </header>
      <section className="framer-hero" aria-labelledby="framer-hero-title">
        <div className="framer-hero-media" aria-hidden="true"><Video srcType="URL" srcUrl={placeholder} playing={false} muted loop poster={placeholder} /></div>
        <div className="framer-hero-copy">
          <FramerItem><Subtext1 xYAcekjZW="SIZA / CLEANER APPLICATIONS" Oqvjuiple="rgb(245,245,245)" /></FramerItem>
          <h1 id="framer-hero-title">Build your work,<br /><em>your way.</em></h1>
          <p>Join a Johannesburg-first marketplace for cleaners. Apply with your details, documents and two references.</p>
          <div className="framer-actions"><Link href="/cleaners/apply">Start your application <span aria-hidden="true">↗</span></Link><Link href="/book">Request a clean <span aria-hidden="true">↗</span></Link></div>
        </div>
        <div className="framer-preloader" aria-hidden="true"><FramerItem><PreLoader variant="1" /></FramerItem></div>
      </section>

      <section className="framer-section" aria-labelledby="apply-title">
        <FramerItem><Subtext2 xYAcekjZW="YOUR APPLICATION" /></FramerItem>
        <h2 id="apply-title">Start with the <em>right details.</em></h2>
        <p className="framer-intro">A complete application helps SIZA review your details clearly. We only use “vetted” after every required check is complete.</p>
        <div className="framer-card-grid framer-card-grid--three">{work.slice(0, 3).map(([step, title, text], index) => { const Card = WorkCards[index]; return <FramerItem key={step}><Card variant="Card 01" k7kFoKCRe={`// ${step}`} BHN2_XwgO={title} sWf_YPZzU={text} CKyB_8bxK={placeholder} /></FramerItem>; })}</div>
      </section>

      <section className="framer-section framer-section--dark" aria-labelledby="checks-title">
        <FramerItem><Subtext3 xYAcekjZW="HOW SIZA VETS" Oqvjuiple="rgb(245,245,245)" /></FramerItem>
        <h2 id="checks-title">Three checks.<br /><em>All complete.</em></h2>
        <p className="framer-intro">SIZA does not imply government verification, background checks, insurance or guarantees.</p>
        <div className="framer-card-grid framer-card-grid--three">{work.slice(3, 6).map(([step, title, text], index) => { const Card = WorkCards[index + 3]; return <FramerItem key={step}><Card variant="Card 02" k7kFoKCRe={`// ${step}`} BHN2_XwgO={title} sWf_YPZzU={text} CKyB_8bxK={placeholder} /></FramerItem>; })}</div>
      </section>

      <section className="framer-section" aria-labelledby="services-title">
        <FramerItem><Subtext4 xYAcekjZW="SERVICES / PLACEHOLDERS" /></FramerItem>
        <h2 id="services-title">Cleaning requests,<br /><em>clearly described.</em></h2>
        <p className="framer-intro">These service cards are placeholders for future approved SIZA imagery. They do not represent completed SIZA jobs.</p>
        <div className="framer-project-grid">{services.map(([title, location, type], index) => { const Card = ProjectCards[index]; return <FramerItem key={title}><Card variant={index === 0 ? "Big card" : "Small Card"} IienP9oz0={location} haGa7eoma={type} dT_K6ZFq1={title} iiHNY3XXA={placeholder} /></FramerItem>; })}</div>
      </section>

      <section className="framer-section framer-section--soft" aria-labelledby="host-title">
        <FramerItem><Subtext5 xYAcekjZW="FOR HOSTS" /></FramerItem>
        <h2 id="host-title">A cleaner request,<br /><em>properly arranged.</em></h2>
        <div className="framer-card-grid framer-card-grid--three">{work.slice(6).map(([step, title, text], index) => { const Card = WorkCards[index + 6]; return <FramerItem key={step}><Card variant="Card 01" k7kFoKCRe={`// ${step}`} BHN2_XwgO={title} sWf_YPZzU={text} CKyB_8bxK={placeholder} /></FramerItem>; })}</div>
        <Link className="framer-text-link" href="/book">Request a clean <span aria-hidden="true">↗</span></Link>
      </section>

      <section className="framer-section framer-section--dark" aria-labelledby="launch-title">
        <FramerItem><Subtext6 xYAcekjZW="JOHANNESBURG / LAUNCH STAGE" Oqvjuiple="rgb(245,245,245)" /></FramerItem>
        <h2 id="launch-title">A clear process,<br /><em>from the start.</em></h2>
        <div className="framer-card-grid framer-card-grid--three">{[
          ["APPLICATION REVIEW", 1, "SIZA reviews each cleaner application before approval."],
          ["REQUIRED CHECKS", 3, "Vetted means all three stated checks are complete."],
          ["DIRECT PAYMENT", 1, "SIZA does not hold funds or cover payment disputes."],
        ].map(([label, count, text], index) => { const Card = JourneyCards[index]; return <FramerItem key={label as string}><Card vdeHRpoDE={label as string} HdFmJIJEO={count as number} EEz2fPdEY="" mhn8uOEcb={text as string} /></FramerItem>; })}</div>
      </section>

      <section className="framer-section" aria-labelledby="guides-title">
        <FramerItem><Subtext7 xYAcekjZW="GET READY" /></FramerItem>
        <h2 id="guides-title">Useful before<br /><em>you begin.</em></h2>
        <div className="framer-card-grid framer-card-grid--three">{[
          ["YOUR APPLICATION", "Have your details, documents and two references ready."],
          ["THE VETTING CHECKLIST", "Understand the exact three checks needed before approval."],
          ["PAYMENT, PLAINLY", "Know that payment is arranged directly after the job."],
        ].map(([title, text], index) => { const Card = BlogCards[index]; return <FramerItem key={title}><Card variant="Small Card" tlE1OFuJE={placeholder} gmPYkkfdi="SIZA / LAUNCH" VCOqB9hIv={`${title}: ${text}`} /></FramerItem>; })}</div>
      </section>

      <section className="framer-section framer-section--soft" aria-labelledby="faq-title">
        <h2 id="faq-title">Questions, <em>answered.</em></h2>
        <div className="framer-faq-shell" aria-hidden="true"><FaqShell variant="Variant 1" /></div>
        <div className="framer-faqs">{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
      </section>

      <section className="framer-closing" aria-labelledby="closing-title">
        <h2 id="closing-title">Ready to start?</h2>
        <p>Cleaner applications are now open for Johannesburg.</p>
        <div className="framer-button-shell" aria-hidden="true"><FormButtonShell variant="Default" /></div>
        <Link className="framer-native-button" href="/cleaners/apply">Start your application <span aria-hidden="true">↗</span></Link>
      </section>
    </main>
  );
}
