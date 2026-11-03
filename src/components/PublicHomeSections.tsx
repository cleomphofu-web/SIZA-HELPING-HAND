"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { t } from "@/content/t";
import {
  homeFaq,
  homeHowSteps,
  homePricingTiers,
  homeReasons,
  homeServices,
  homeSpotlightItems,
  verifiedSpacesGallery,
} from "@/lib/public-home-content";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

function CarvedHeading({
  id,
  copyKey,
  image,
}: {
  id: string;
  copyKey: "home.services.title" | "home.how.title";
  image: string;
}) {
  return (
    <div className="home-carved-heading">
      <h2 className="sr-only" id={id}>
        {t(copyKey)}
      </h2>
      <Image
        alt=""
        aria-hidden="true"
        height={725}
        sizes="(max-width: 767px) 92vw, 65vw"
        src={image}
        width={2170}
      />
    </div>
  );
}

export function PublicHomeSections() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    const reduced = prefersReducedMotion();

    const ctx = gsap.context(() => {
      if (reduced) return;

      // 1. Horizontal Process Timeline (Desktop Pinning & Scrub)
      const pinContainer = containerRef.current?.querySelector(".home-process-pin") as HTMLElement | null;
      const track = containerRef.current?.querySelector(".home-process-track") as HTMLElement | null;
      const rule = containerRef.current?.querySelector(".home-process-rule") as HTMLElement | null;
      const stepPhotos = gsap.utils.toArray<HTMLElement>(".home-process-photo");

      if (pinContainer && track && window.innerWidth >= 768) {
        const getScrollDistance = () => track.scrollWidth - track.clientWidth;

        const pinTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: pinContainer,
            pin: true,
            scrub: 0.8,
            start: "top 16%",
            end: () => `+=${Math.max(track.scrollWidth - window.innerWidth + 200, 700)}`,
            invalidateOnRefresh: true,
          },
        });

        pinTimeline.to(track, {
          x: () => -getScrollDistance(),
          ease: "none",
        });

        if (rule) {
          pinTimeline.fromTo(
            rule,
            { scaleX: 0 },
            { scaleX: 1, ease: "none" },
            0
          );
        }

        if (stepPhotos.length) {
          stepPhotos.forEach((photo) => {
            pinTimeline.fromTo(
              photo,
              { scale: 0.88, opacity: 0.85 },
              { scale: 1, opacity: 1, ease: "power1.out" },
              "<0.1"
            );
          });
        }
      } else {
        const stepItems = gsap.utils.toArray<HTMLElement>(".home-step-item");
        if (stepItems.length) {
          gsap.fromTo(
            stepItems,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.12,
              ease: "power2.out",
              scrollTrigger: {
                trigger: ".home-how",
                start: "top 80%",
                once: true,
              },
            }
          );
        }
      }

      // 2. Services cards staggered reveal
      const serviceCards = gsap.utils.toArray<HTMLElement>(".home-service-card-item");
      if (serviceCards.length) {
        gsap.fromTo(
          serviceCards,
          { opacity: 0, y: 40, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".home-services",
              start: "top 78%",
              once: true,
            },
          }
        );
      }

      // 3. Helper Spotlight (Fanned card stack dealing out on desktop)
      const spotlightList = containerRef.current?.querySelector(".home-spotlight-list") as HTMLElement | null;
      const spotlightCards = gsap.utils.toArray<HTMLElement>(".home-spotlight-card");
      if (spotlightList && spotlightCards.length === 3 && window.innerWidth >= 768) {
        const mid = 1;
        const dx = (i: number) => (spotlightCards[mid].offsetLeft - spotlightCards[i].offsetLeft);
        const dy = (i: number) => (spotlightCards[mid].offsetTop - spotlightCards[i].offsetTop);

        const dealTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: spotlightList,
            start: "top 82%",
            end: "center 56%",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });

        spotlightCards.forEach((card, i) => {
          gsap.set(card, { zIndex: i === mid ? 3 : 2 });
          dealTimeline.fromTo(
            card,
            {
              x: () => dx(i),
              y: () => dy(i),
              rotation: (i - mid) * 5,
              scale: 0.92,
            },
            {
              x: 0,
              y: 0,
              rotation: 0,
              scale: 1,
              ease: "power2.inOut",
              duration: 1,
            },
            0
          );
        });
      } else if (spotlightCards.length) {
        gsap.fromTo(
          spotlightCards,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".home-spotlight",
              start: "top 80%",
              once: true,
            },
          }
        );
      }

      // 4. Verified spaces gallery reveal
      const galleryCards = gsap.utils.toArray<HTMLElement>(".home-space-card");
      if (galleryCards.length) {
        gsap.fromTo(
          galleryCards,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".home-spaces",
              start: "top 80%",
              once: true,
            },
          }
        );
      }

      // 5. Transparent Pricing Table reveal
      const pricingCards = gsap.utils.toArray<HTMLElement>(".home-pricing-card");
      if (pricingCards.length) {
        gsap.fromTo(
          pricingCards,
          { opacity: 0, y: 35, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.15,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".home-pricing",
              start: "top 80%",
              once: true,
            },
          }
        );
      }

      // 6. Why siZa reasons reveal
      const reasonCards = gsap.utils.toArray<HTMLElement>(".home-reason-item");
      if (reasonCards.length) {
        gsap.fromTo(
          reasonCards,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".home-why",
              start: "top 80%",
              once: true,
            },
          }
        );
      }

      // 7. For Helpers articles reveal
      const helperArticles = gsap.utils.toArray<HTMLElement>(".home-helper-item");
      if (helperArticles.length) {
        gsap.fromTo(
          helperArticles,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".home-helpers",
              start: "top 80%",
              once: true,
            },
          }
        );
      }

      // 8. Closing CTA reveal
      const closingArticles = gsap.utils.toArray<HTMLElement>(".home-closing-item");
      if (closingArticles.length) {
        gsap.fromTo(
          closingArticles,
          { opacity: 0, scale: 0.96, y: 20 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: "back.out(1.4)",
            scrollTrigger: {
              trigger: ".home-closing",
              start: "top 82%",
              once: true,
            },
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef}>
      {/* 1. How It Works (Horizontal Pinned Timeline on Desktop) */}
      <section
        aria-labelledby="how-title"
        className="home-section home-how overflow-hidden"
        id="how-it-works"
      >
        <p className="home-section-label">{t("home.how.label")}</p>
        <CarvedHeading
          copyKey="home.how.title"
          id="how-title"
          image="/assets/images/og/How%20It%20Works%20in%20Carved%20Wood.png"
        />
        <p className="home-section-subtitle">{t("home.how.subtitle")}</p>

        {/* Progress bar rule on desktop */}
        <div className="hidden md:block w-full max-w-[70rem] mx-auto mt-6 mb-2 px-4">
          <div className="h-1 w-full bg-neutral-200 rounded-full overflow-hidden">
            <div className="home-process-rule h-full w-full bg-black origin-left" />
          </div>
        </div>

        {/* Horizontal Process Track */}
        <div className="home-process-pin mt-6 md:mt-8 px-4">
          <div className="overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-none">
            <ol className="home-process-track flex flex-col md:flex-row gap-6 md:gap-8 max-w-[70rem] mx-auto w-full md:w-max">
              {homeHowSteps.map((step) => (
                <li
                  className="home-step-item w-full md:w-[22rem] shrink-0 border border-neutral-200 rounded-2xl bg-white p-6 shadow-xs group transition-all"
                  key={step.label}
                >
                  <div className="home-process-photo relative aspect-4/3 w-full overflow-hidden rounded-xl bg-neutral-200 mb-5">
                    <Image
                      alt=""
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      fill
                      sizes="(max-width: 767px) 90vw, 360px"
                      src={step.image}
                    />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    {t(step.label)}
                  </span>
                  <h3 className="text-xl font-medium tracking-tight mb-2 text-black">
                    {t(step.title)}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {t(step.body)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 2. Services */}
      <section
        aria-labelledby="services-title"
        className="home-section home-services"
        id="services"
      >
        <p className="home-section-label">{t("home.services.label")}</p>
        <CarvedHeading
          copyKey="home.services.title"
          id="services-title"
          image="/assets/images/og/Carved%20Wooden%20Service%20Letters.png"
        />
        <p className="home-section-subtitle">{t("home.services.subtitle")}</p>
        <ul className="home-service-grid">
          {homeServices.map((service) => (
            <li
              className="home-service-card home-service-card-item overflow-hidden group hover:border-black transition-colors"
              key={service.title}
            >
              <div className="relative aspect-video w-full overflow-hidden rounded-md bg-neutral-200 mb-4">
                <Image
                  alt=""
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  fill
                  sizes="(max-width: 767px) 90vw, 45vw"
                  src={service.image}
                />
              </div>
              <h3>{t(service.title)}</h3>
              <p className="mt-1 text-neutral-600">{t(service.body)}</p>
              {service.comingSoon && (
                <span className="home-coming-soon mt-3 inline-block">
                  {t("label.coming_soon")}
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className="home-service-note">{t("service.coming_soon_note")}</p>
        <Link className="home-section-link" href="/request">
          {t("button.request")}
        </Link>
      </section>

      {/* 3. Helper Spotlight (Fanned Stack Animation) */}
      <section
        aria-labelledby="spotlight-title"
        className="home-section home-spotlight bg-neutral-50/70 border-t border-neutral-200/80 overflow-hidden"
        id="spotlight"
      >
        <p className="home-section-label">{t("home.spotlight.label")}</p>
        <h2 id="spotlight-title" className="text-3xl sm:text-4xl font-medium tracking-tight text-center max-w-2xl mx-auto text-black">
          {t("home.spotlight.title")}
        </h2>
        <p className="home-section-subtitle text-center mt-2 max-w-xl mx-auto text-neutral-600">
          {t("home.spotlight.subtitle")}
        </p>

        <div className="home-spotlight-wrap relative max-w-[70rem] mx-auto mt-12 px-4">
          <ul className="home-spotlight-list grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {homeSpotlightItems.map((item) => (
              <li
                key={item.title}
                className="home-spotlight-card border border-neutral-200 rounded-2xl bg-white p-6 shadow-sm flex flex-col group transition-all"
              >
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-neutral-900 mb-5">
                  <Image
                    alt=""
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
                    fill
                    sizes="(max-width: 767px) 90vw, 360px"
                    src={item.image}
                  />
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-[11px] font-semibold text-white tracking-wide uppercase">
                      {t(item.badge)}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-medium tracking-tight mb-2 text-black">
                  {t(item.title)}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {t(item.body)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4. Verified Spaces Showcase */}
      <section aria-labelledby="spaces-title" className="home-section home-spaces bg-neutral-100/60 border-y border-neutral-200">
        <p className="home-section-label">{t("home.spaces.label")}</p>
        <h2 id="spaces-title">{t("home.spaces.title")}</h2>
        <p className="home-section-subtitle">{t("home.spaces.subtitle")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 max-w-[70rem] mx-auto mt-8 px-4">
          {verifiedSpacesGallery.map((space) => (
            <div
              key={space.id}
              className="home-space-card group relative aspect-4/5 overflow-hidden rounded-lg bg-neutral-900 border border-neutral-200/80 shadow-xs"
            >
              <Image
                alt=""
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110 opacity-90 group-hover:opacity-100"
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                src={space.image}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-white/90">
                  {space.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Transparent Pricing Table */}
      <section
        aria-labelledby="pricing-title"
        className="home-section home-pricing border-t border-neutral-200 overflow-hidden"
        id="pricing"
      >
        <p className="home-section-label">{t("home.pricing.label")}</p>
        <h2 id="pricing-title" className="text-3xl sm:text-4xl font-medium tracking-tight text-center max-w-2xl mx-auto text-black">
          {t("home.pricing.title")}
        </h2>
        <p className="home-section-subtitle text-center mt-2 max-w-xl mx-auto text-neutral-600">
          {t("home.pricing.subtitle")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[56rem] mx-auto mt-12 px-4">
          {/* Host Plan Card */}
          <div className="home-pricing-card border-2 border-neutral-900 rounded-3xl p-8 bg-white shadow-md flex flex-col justify-between">
            <div>
              <div className="inline-block bg-neutral-100 text-neutral-900 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                {t(homePricingTiers.host.label)}
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900">
                  {t(homePricingTiers.host.price)}
                </span>
              </div>
              <p className="text-sm text-neutral-500 mb-6">
                {t(homePricingTiers.host.period)}
              </p>
              <hr className="border-neutral-200 mb-6" />
              <ul className="space-y-3 mb-8">
                {homePricingTiers.host.benefits.map((bKey) => (
                  <li key={bKey} className="flex items-start text-sm text-neutral-700">
                    <span className="font-bold text-neutral-900 mr-2.5 select-none">-</span>
                    <span>{t(bKey)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href={homePricingTiers.host.href}
              className="w-full py-3.5 px-6 rounded-full bg-neutral-900 text-white font-semibold text-center hover:bg-neutral-800 transition-colors"
            >
              {t(homePricingTiers.host.cta)}
            </Link>
          </div>

          {/* Helper Plan Card */}
          <div className="home-pricing-card border border-neutral-800 rounded-3xl p-8 bg-neutral-900 text-white shadow-md flex flex-col justify-between">
            <div>
              <div className="inline-block bg-white/10 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                {t(homePricingTiers.helper.label)}
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
                  {t(homePricingTiers.helper.price)}
                </span>
              </div>
              <p className="text-sm text-neutral-400 mb-6">
                {t(homePricingTiers.helper.period, { subscriptionPrice: "150", subscriptionDays: "30" })}
              </p>
              <hr className="border-white/15 mb-6" />
              <ul className="space-y-3 mb-8">
                {homePricingTiers.helper.benefits.map((bKey) => (
                  <li key={bKey} className="flex items-start text-sm text-neutral-300">
                    <span className="font-bold text-white mr-2.5 select-none">-</span>
                    <span>{t(bKey)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href={homePricingTiers.helper.href}
              className="w-full py-3.5 px-6 rounded-full bg-white text-neutral-900 font-semibold text-center hover:bg-neutral-100 transition-colors"
            >
              {t(homePricingTiers.helper.cta)}
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Why siZa */}
      <section aria-labelledby="why-title" className="home-section home-why">
        <p className="home-section-label">{t("home.why.label")}</p>
        <h2 id="why-title">{t("home.why.title")}</h2>
        <ul className="home-reason-grid">
          {homeReasons.map((reason) => (
            <li className="home-reason-item" key={reason.title}>
              <h3>{t(reason.title)}</h3>
              <p className="mt-2 text-neutral-600">{t(reason.body)}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 7. For Helpers */}
      <section
        aria-labelledby="helpers-title"
        className="home-section home-helpers"
        id="helpers"
      >
        <p className="home-section-label">{t("home.helpers.label")}</p>
        <h2 id="helpers-title">{t("home.helpers.title")}</h2>
        <div className="home-helper-grid">
          <article className="home-helper-item">
            <h3>{t("home.helpers.pay.title")}</h3>
            <p>{t("home.helpers.pay.body")}</p>
          </article>
          <article className="home-helper-item">
            <h3>{t("home.helpers.free.title")}</h3>
          </article>
          <article className="home-helper-item">
            <h3>{t("home.helpers.no_penalty.title")}</h3>
            <p>{t("home.helpers.no_penalty.body")}</p>
          </article>
        </div>
        <Link className="home-section-link" href="/apply">
          {t("home.helpers.cta")}
        </Link>
      </section>

      {/* 8. FAQ */}
      <section aria-labelledby="faq-title" className="home-section home-faq">
        <p className="home-section-label">{t("faq.label")}</p>
        <h2 id="faq-title">{t("faq.title")}</h2>
        <p className="home-section-subtitle">{t("faq.subtitle")}</p>
        <div className="home-faq-list">
          {homeFaq.map((item) => (
            <details className="group transition-all" key={item.question}>
              <summary className="select-none flex items-center justify-between">
                <span>{t(item.question)}</span>
              </summary>
              <p className="mt-2 text-neutral-600">{t(item.answer)}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 9. Closing CTA */}
      <section
        aria-labelledby="home-cta-title"
        className="home-section home-closing"
      >
        <p className="home-section-label">{t("home.cta.label")}</p>
        <h2 id="home-cta-title">{t("home.cta.title")}</h2>
        <div className="home-closing-grid">
          <article className="home-closing-item">
            <h3>{t("home.cta.host.title")}</h3>
            <p>{t("home.cta.host.body")}</p>
            <Link className="home-section-link" href="/request">
              {t("button.request")}
            </Link>
          </article>
          <article className="home-closing-item">
            <h3>{t("home.cta.helper.title")}</h3>
            <p>{t("home.cta.helper.body")}</p>
            <Link className="home-section-link" href="/apply">
              {t("button.apply")}
            </Link>
          </article>
        </div>
      </section>
    </div>
  );
}
