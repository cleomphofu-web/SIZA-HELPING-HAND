import Image from "next/image";
import type { CopyKey } from "@/content/copy.generated";
import { t } from "@/content/t";
import { publicConfig } from "@/server/config/public";
import { PublicHeader } from "@/components/PublicHeader";
import { HomeHeroClient } from "@/components/HomeHeroClient";

type PublicHeroProps = {
  wordKey: CopyKey;
  headingKey: CopyKey;
  headingImage: string;
  heroImage: string;
};

export function HomeHero() {
  return (
    <HomeHeroClient
      siteName={t("site.name")}
      hostProps={{
        switchLabel: t("home.hero.switch.host"),
        title: t("home.hero.host.title"),
        summary: t("home.hero.host.subtitle"),
        action: t("home.hero.host.cta"),
        secondary: t("home.hero.host.cta_secondary"),
      }}
      helperProps={{
        switchLabel: t("home.hero.switch.helper"),
        title: t("home.hero.helper.title"),
        summary: t("home.hero.helper.subtitle"),
        action: t("home.hero.helper.cta"),
        secondary: t("home.hero.helper.cta_secondary"),
      }}
    />
  );
}

export function PublicHero({ wordKey, headingKey, headingImage, heroImage }: PublicHeroProps) {
  return (
    <>
      <section className="page-hero" aria-labelledby="page-title">
        <PublicHeader />
        <Image alt="" className="page-hero-background" fill priority sizes="100vw" src={heroImage} />
        <h1 id="page-title">{t(wordKey)}</h1>
      </section>
      <section className="carved-heading" aria-labelledby="content-title">
        <Image alt="" height={725} sizes="(max-width: 767px) 100vw, 65vw" src={headingImage} width={2170} />
        <h2 className="sr-only" id="content-title">{t(headingKey, publicConfig)}</h2>
      </section>
    </>
  );
}
