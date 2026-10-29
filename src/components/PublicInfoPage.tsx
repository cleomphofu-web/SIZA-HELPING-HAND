import type { CopyKey } from "@/content/copy.generated";
import { t } from "@/content/t";
import { publicConfig } from "@/server/config/public";
import { PublicHero } from "@/components/PublicHero";

type PublicInfoPageProps = {
  wordKey: CopyKey;
  headingKey: CopyKey;
  headingImage: string;
  heroImage: string;
  summaryKey: CopyKey;
};

export function PublicInfoPage({ wordKey, headingKey, headingImage, heroImage, summaryKey }: PublicInfoPageProps) {
  return (
    <main id="main-content">
      <PublicHero headingImage={headingImage} headingKey={headingKey} heroImage={heroImage} wordKey={wordKey} />
      <section className="public-summary" aria-label={t(headingKey, publicConfig)}>
        <p>{t(summaryKey, publicConfig)}</p>
      </section>
    </main>
  );
}
