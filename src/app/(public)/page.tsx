import { HomeHero } from "@/components/PublicHero";
import { PublicHomeSections } from "@/components/PublicHomeSections";
import { t } from "@/content/t";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { homeSectionRoutes } from "@/lib/public-home-content";
import { optionalActor } from "@/server/policies/auth";

export default async function HomePage() {
  const actor = await optionalActor();
  if (actor) {
    if (actor.role === "helper") redirect("/helper");
    if (actor.role === "host") redirect("/app");
    if (actor.role === "admin") redirect("/admin");
  }

  return (
    <>
      <HomeHero />
      <main id="main-content">
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
