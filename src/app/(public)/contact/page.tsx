import Image from "next/image";
import Link from "next/link";
import { PublicHero } from "@/components/PublicHero";
import { t } from "@/content/t";
import { publicConfig } from "@/server/config/public";

export default function ContactPage() {
  return (
    <main id="main-content">
      <PublicHero
        headingImage="/assets/images/og/Carved%20Wooden%20CONTACT%20Typography.png"
        headingKey="contact.hero.title"
        heroImage="/assets/images/hero/public/contact-room.jpg"
        wordKey="public.hero.contact"
      />
      <section className="public-summary max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-lg text-neutral-700 leading-relaxed max-w-2xl mx-auto">
          {t("contact.hero.body", publicConfig)}
        </p>

        {/* Atmospheric Contact Card */}
        <div className="relative overflow-hidden rounded-3xl max-w-xl mx-auto p-8 sm:p-12 text-white border border-neutral-800 shadow-xl mt-10 isolate">
          <Image
            alt=""
            aria-hidden="true"
            className="object-cover -z-1 opacity-70 pointer-events-none"
            fill
            sizes="(max-width: 767px) 95vw, 600px"
            src="/assets/images/about/contact%20us%20form%20background%20image.png"
          />
          <div className="relative z-1 space-y-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              {t("contact.hero.title")}
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                className="inline-flex min-h-[48px] items-center justify-center px-6 rounded-xl bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors"
                href={`mailto:${publicConfig.supportEmail}`}
              >
                {t("contact.email")}
              </a>
              <Link
                className="inline-flex min-h-[48px] items-center justify-center px-6 rounded-xl bg-black/80 backdrop-blur-md text-white border border-white/20 text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
                href="/"
              >
                {t("site.name")}
              </Link>
            </div>
            <p className="text-xs text-neutral-300">
              {t("contact.form.prototype", publicConfig)}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
