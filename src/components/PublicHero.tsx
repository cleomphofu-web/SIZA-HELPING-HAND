import Image from "next/image";
import type { CopyKey } from "@/content/copy.generated";
import { t } from "@/content/t";
import { publicConfig } from "@/server/config/public";
import { PublicHeader } from "@/components/PublicHeader";

type PublicHeroProps = {
  wordKey: CopyKey;
  headingKey: CopyKey;
  headingImage: string;
  heroImage: string;
};

export function HomeHero() {
  return (
    <section aria-label={t("site.name")} className="home-hero">
      <PublicHeader />
      <Image alt="" className="home-hero-background" fill priority sizes="100vw" src="/assets/images/hero/background%20home%20page%20hero.png" />
      <Image alt="" className="home-hero-wordmark" height={1086} priority sizes="(max-width: 767px) 88vw, 58vw" src="/assets/images/hero/Marshmallow%20home%20page%20hero.png" width={1448} />
    </section>
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
