import Image from "next/image";
import { PublicHeader } from "@/components/PublicHeader";
import { ContactClient } from "@/components/ContactClient";
import { t } from "@/content/t";
import { Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="pt-24 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Page starts with Carved Wooden CONTACT Typography */}
        <section aria-labelledby="contact-heading" className="text-center">
          <div className="home-carved-heading my-2">
            <Image
              alt={t("contact.hero.label")}
              className="w-full h-auto max-h-[clamp(7rem,20vw,13rem)] object-contain mix-blend-multiply"
              height={725}
              priority
              sizes="(max-width: 767px) 94vw, 56rem"
              src="/assets/images/og/Carved%20Wooden%20CONTACT%20Typography.png"
              width={2170}
            />
            <h1 className="sr-only" id="contact-heading">
              {t("contact.hero.label")}
            </h1>
          </div>

          {/* Short description of when users can contact siZa right below heading */}
          <div className="text-center max-w-2xl mx-auto mt-2 mb-10 px-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 text-neutral-800 text-xs sm:text-sm font-semibold tracking-wide mb-3 border border-neutral-200 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              <span>{t("contact.hours.badge")}</span>
            </div>
            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed font-normal">
              {t("contact.hours.body")}
            </p>
          </div>
        </section>

        {/* Contact details + "Ask us anything" card */}
        <section aria-label="Contact options" className="mt-4">
          <ContactClient />
        </section>
      </main>
    </>
  );
}
