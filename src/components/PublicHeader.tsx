import Link from "next/link";
import { t } from "@/content/t";
import { homeSectionRoutes } from "@/lib/public-home-content";
import { PublicMenu } from "@/components/PublicMenu";

const defaultLinks = [
  ["/about", "nav.about"],
  [homeSectionRoutes.services, "home.services.title"],
  [homeSectionRoutes.howItWorks, "home.how.label"],
  ["/request", "nav.request"],
  ["/apply", "nav.apply"],
  ["/contact", "nav.contact"],
  ["/login", "nav.login"],
] as const;

const floatingLinks = [
  ["/about", "nav.about"],
  [homeSectionRoutes.services, "home.services.title"],
  ["/contact", "nav.contact"],
] as const;

export function PublicHeader({ floating = false }: { floating?: boolean } = {}) {
  if (floating) {
    return (
      <header className="public-header-floating fixed top-5 sm:top-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl flex items-center justify-between px-6 sm:px-8 py-3.5 rounded-full bg-black/85 backdrop-blur-md border border-white/15 shadow-2xl text-white">
        <a className="public-skip-link" href="#main-content">
          {t("nav.skip")}
        </a>
        <Link className="public-wordmark text-white hover:opacity-80 transition-opacity" href="/">
          {t("site.name")}
        </Link>
        <nav aria-label={t("nav.menu")} className="flex items-center gap-5 sm:gap-7 text-xs sm:text-sm font-semibold tracking-wider uppercase text-white/90">
          {floatingLinks.map(([href, key]) => (
            <Link className="hover:text-white transition-colors" href={href} key={href}>
              {t(key).replace(" //", "")}
            </Link>
          ))}
        </nav>
      </header>
    );
  }

  return (
    <header className="public-header">
      <a className="public-skip-link" href="#main-content">
        {t("nav.skip")}
      </a>
      <Link className="public-wordmark" href="/">
        {t("site.name")}
      </Link>
      <nav aria-label={t("nav.menu")} className="public-nav">
        {defaultLinks.map(([href, key]) => (
          <Link href={href} key={href}>
            {t(key).replace(" //", "")}
          </Link>
        ))}
      </nav>
      <PublicMenu
        links={defaultLinks.map(([href, key]) => ({
          href,
          label: t(key).replace(" //", ""),
        }))}
        menuLabel={t("nav.menu")}
      />
    </header>
  );
}
