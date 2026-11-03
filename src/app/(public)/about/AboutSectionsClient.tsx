"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { t } from "@/content/t";
import { publicConfig } from "@/server/config/public";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

export function AboutSectionsClient() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".about-belief-card");
      if (cards.length) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".about-beliefs-grid",
              start: "top 80%",
              once: true,
            },
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto px-4 py-12 space-y-16">
      {/* Intro Bridge */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          {t("about.why.label")}
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
          {t("about.why.title")}
        </h2>
        <p className="text-base text-neutral-600 leading-relaxed">
          {t("about.why.bridge")}
        </p>
      </section>

      {/* Beliefs Grid */}
      <section className="space-y-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            {t("about.believe.label")}
          </p>
        </div>
        <div className="about-beliefs-grid grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="about-belief-card p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-2">
            <h3 className="text-lg font-bold text-neutral-900">{t("about.believe.1.title")}</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">{t("about.believe.1.body")}</p>
          </div>
          <div className="about-belief-card p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-2">
            <h3 className="text-lg font-bold text-neutral-900">{t("about.believe.2.title")}</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">{t("about.believe.2.body")}</p>
          </div>
          <div className="about-belief-card p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-2">
            <h3 className="text-lg font-bold text-neutral-900">{t("about.believe.3.title")}</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">{t("about.believe.3.body")}</p>
          </div>
          <div className="about-belief-card p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-2">
            <h3 className="text-lg font-bold text-neutral-900">{t("about.believe.4.title")}</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">{t("about.believe.4.body")}</p>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="p-8 sm:p-12 rounded-3xl bg-neutral-900 text-white text-center space-y-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          {t("about.cta.label")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            className="inline-flex min-h-[48px] items-center justify-center px-6 rounded-xl bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors"
            href="/signup?role=host"
          >
            {t("button.request")}
          </Link>
          <Link
            className="inline-flex min-h-[48px] items-center justify-center px-6 rounded-xl bg-black border border-white/20 text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
            href="/signup?role=helper"
          >
            {t("button.apply")}
          </Link>
        </div>
        <p className="text-xs text-neutral-400">
          {t("about.cta.questions", publicConfig)}
        </p>
      </section>
    </div>
  );
}
