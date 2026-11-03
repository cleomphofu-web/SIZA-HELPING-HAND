import { HomeHero } from "@/components/PublicHero";
import { HomeHeroActions } from "@/components/HomeHeroActions";
import { PublicHomeSections } from "@/components/PublicHomeSections";
import { t } from "@/content/t";
import { publicConfig } from "@/server/config/public";
import Link from "next/link";
import Image from "next/image";
import { homeSectionRoutes } from "@/lib/public-home-content";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <main id="main-content">
        <section aria-labelledby="home-title" className="home-intro">
          <p className="home-section-label">{t("home.hero.eyebrow", publicConfig)}</p>
          <HomeHeroActions
            host={{
              switchLabel: t("home.hero.switch.host"),
              title: t("home.hero.host.title"),
              summary: t("home.hero.host.subtitle"),
              action: t("home.hero.host.cta"),
              secondary: t("home.hero.host.cta_secondary"),
            }}
            helper={{
              switchLabel: t("home.hero.switch.helper"),
              title: t("home.hero.helper.title"),
              summary: t("home.hero.helper.subtitle"),
              action: t("home.hero.helper.cta"),
              secondary: t("home.hero.helper.cta_secondary"),
            }}
          />
        </section>
        <section className="public-summary" aria-labelledby="holding-title">
          <h2 id="holding-title">{t("holding.title", publicConfig)}</h2>
          <p>{t("holding.body")}</p>
          <p>{t("holding.contact", publicConfig)}</p>
        </section>
        <PublicHomeSections />
      </main>
      <footer className="public-footer relative overflow-hidden isolate">
        <Image
          alt=""
          aria-hidden="true"
          className="object-cover opacity-25 -z-1 pointer-events-none"
          fill
          sizes="100vw"
          src="/assets/images/footer/Footer%20bg%20img.png"
        />
        <Link className="public-footer-wordmark relative z-1" href="/">{t("site.name")}</Link>
        <p className="relative z-1">{t("footer.tagline")}</p>
        <p className="relative z-1">{t("footer.areas")}</p>
        <nav aria-label={t("nav.menu")} className="relative z-1">
          <Link href="/about">{t("nav.about")}</Link>
          <Link href={homeSectionRoutes.services}>{t("home.services.title")}</Link>
          <Link href={homeSectionRoutes.howItWorks}>{t("home.how.label")}</Link>
          <Link href="/contact">{t("footer.contact")}</Link>
          <Link href="/privacy">{t("footer.privacy")}</Link>
          <Link href="/terms">{t("footer.terms")}</Link>
        </nav>
        <small className="relative z-1">{t("footer.rights", { year: String(new Date().getFullYear()) })}</small>
      </footer>
    </>
  );
}
