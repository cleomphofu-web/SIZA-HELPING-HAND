import Image from "next/image";
import Link from "next/link";
import { t } from "@/content/t";
import { homeFaq, homeHowSteps, homeReasons, homeServices } from "@/lib/public-home-content";

function CarvedHeading({ id, copyKey, image }: { id: string; copyKey: "home.services.title" | "home.how.title"; image: string }) {
  return (
    <div className="home-carved-heading">
      <h2 className="sr-only" id={id}>{t(copyKey)}</h2>
      <Image alt="" aria-hidden="true" height={725} sizes="(max-width: 767px) 92vw, 65vw" src={image} width={2170} />
    </div>
  );
}

export function PublicHomeSections() {
  return (
    <>
      <section aria-labelledby="how-title" className="home-section home-how" id="how-it-works">
        <p className="home-section-label">{t("home.how.label")}</p>
        <CarvedHeading copyKey="home.how.title" id="how-title" image="/assets/images/og/How%20It%20Works%20in%20Carved%20Wood.png" />
        <p className="home-section-subtitle">{t("home.how.subtitle")}</p>
        <ol className="home-steps">
          {homeHowSteps.map((step) => (
            <li key={step.label}>
              <p className="home-step-label">{t(step.label)}</p>
              <h3>{t(step.title)}</h3>
              <p>{t(step.body)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="services-title" className="home-section home-services" id="services">
        <p className="home-section-label">{t("home.services.label")}</p>
        <CarvedHeading copyKey="home.services.title" id="services-title" image="/assets/images/og/Carved%20Wooden%20Service%20Letters.png" />
        <p className="home-section-subtitle">{t("home.services.subtitle")}</p>
        <ul className="home-service-grid">
          {homeServices.map((service) => (
            <li className="home-service-card" key={service.title}>
              <h3>{t(service.title)}</h3>
              <p>{t(service.body)}</p>
              {service.comingSoon && <span className="home-coming-soon">{t("label.coming_soon")}</span>}
            </li>
          ))}
        </ul>
        <p className="home-service-note">{t("service.coming_soon_note")}</p>
        <Link className="home-section-link" href="/request">{t("button.request")}</Link>
      </section>

      <section aria-labelledby="why-title" className="home-section home-why">
        <p className="home-section-label">{t("home.why.label")}</p>
        <h2 id="why-title">{t("home.why.title")}</h2>
        <ul className="home-reason-grid">
          {homeReasons.map((reason) => (
            <li key={reason.title}>
              <h3>{t(reason.title)}</h3>
              <p>{t(reason.body)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="helpers-title" className="home-section home-helpers" id="helpers">
        <p className="home-section-label">{t("home.helpers.label")}</p>
        <h2 id="helpers-title">{t("home.helpers.title")}</h2>
        <div className="home-helper-grid">
          <article>
            <h3>{t("home.helpers.pay.title")}</h3>
            <p>{t("home.helpers.pay.body")}</p>
          </article>
          <article>
            <h3>{t("home.helpers.free.title")}</h3>
          </article>
          <article>
            <h3>{t("home.helpers.no_penalty.title")}</h3>
            <p>{t("home.helpers.no_penalty.body")}</p>
          </article>
        </div>
        <Link className="home-section-link" href="/apply">{t("home.helpers.cta")}</Link>
      </section>

      <section aria-labelledby="faq-title" className="home-section home-faq">
        <p className="home-section-label">{t("faq.label")}</p>
        <h2 id="faq-title">{t("faq.title")}</h2>
        <p className="home-section-subtitle">{t("faq.subtitle")}</p>
        <div className="home-faq-list">
          {homeFaq.map((item) => (
            <details key={item.question}>
              <summary>{t(item.question)}</summary>
              <p>{t(item.answer)}</p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="home-cta-title" className="home-section home-closing">
        <p className="home-section-label">{t("home.cta.label")}</p>
        <h2 id="home-cta-title">{t("home.cta.title")}</h2>
        <div className="home-closing-grid">
          <article>
            <h3>{t("home.cta.host.title")}</h3>
            <p>{t("home.cta.host.body")}</p>
            <Link className="home-section-link" href="/request">{t("button.request")}</Link>
          </article>
          <article>
            <h3>{t("home.cta.helper.title")}</h3>
            <p>{t("home.cta.helper.body")}</p>
            <Link className="home-section-link" href="/apply">{t("button.apply")}</Link>
          </article>
        </div>
      </section>

    </>
  );
}
