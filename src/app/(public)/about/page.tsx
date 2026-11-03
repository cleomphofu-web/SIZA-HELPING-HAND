import { PublicHero } from "@/components/PublicHero";
import { t } from "@/content/t";
import { publicConfig } from "@/server/config/public";
import { AboutSectionsClient } from "./AboutSectionsClient";

export default function AboutPage() {
  return (
    <main id="main-content">
      <PublicHero
        headingImage="/assets/images/og/Carved%20Wooden%20ABOUT%20Typography.png"
        headingKey="about.hero.title"
        heroImage="/assets/images/hero/public/about-room.jpg"
        wordKey="public.hero.about"
      />
      <section className="public-summary" aria-label={t("about.hero.title", publicConfig)}>
        <p className="max-w-2xl mx-auto text-lg text-neutral-700 leading-relaxed text-center">
          {t("about.hero.body", publicConfig)}
        </p>
      </section>
      <AboutSectionsClient />
    </main>
  );
}
