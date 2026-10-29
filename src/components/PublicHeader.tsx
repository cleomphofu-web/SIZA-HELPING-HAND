import Link from "next/link";
import { t } from "@/content/t";
import { homeSectionRoutes } from "@/lib/public-home-content";
import { PublicMenu } from "@/components/PublicMenu";

const links = [
  ["/about", "nav.about"],
  [homeSectionRoutes.services, "home.services.title"],
  [homeSectionRoutes.howItWorks, "home.how.label"],
  ["/request", "nav.request"],
  ["/apply", "nav.apply"],
  ["/contact", "nav.contact"],
  ["/login", "nav.login"],
] as const;

export function PublicHeader() {
  return (
    <header className="public-header">
      <a className="public-skip-link" href="#main-content">{t("nav.skip")}</a>
      <Link className="public-wordmark" href="/">{t("site.name")}</Link>
      <nav aria-label={t("nav.menu")} className="public-nav">
        {links.map(([href, key]) => <Link href={href} key={href}>{t(key).replace(" //", "")}</Link>)}
      </nav>
      <PublicMenu
        links={links.map(([href, key]) => ({ href, label: t(key).replace(" //", "") }))}
        menuLabel={t("nav.menu")}
      />
    </header>
  );
}
