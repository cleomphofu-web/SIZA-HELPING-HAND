"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import CloudSky from "@/components/originkit/ui/cloud-sky";
import { PublicHeader } from "@/components/PublicHeader";
import { FlowButton } from "@/components/ui/flow-button";
import { animateHero } from "@/lib/gsap";
import { t } from "@/content/t";

export function HomeHeroClient({ siteName }: { siteName: string }) {
  const wordmarkRef = useRef<HTMLDivElement | null>(null);
  const bgRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ctx = animateHero(wordmarkRef.current, bgRef.current, ctaRef.current);
    return () => ctx?.revert();
  }, []);

  return (
    <section
      aria-label={siteName}
      className="home-hero relative min-h-screen flex flex-col justify-center items-center overflow-hidden"
    >
      <PublicHeader floating />
      <div
        ref={bgRef}
        className="absolute inset-0 z-0 overflow-hidden pointer-events-auto"
        aria-hidden="true"
      >
        <CloudSky
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            minWidth: "100%",
            minHeight: "100%",
          }}
        />
      </div>

      {/* Center 3D Marshmallow Wordmark and Guide to Options */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-24 pb-12 pointer-events-none w-full max-w-4xl mx-auto">
        <div
          ref={wordmarkRef}
          className="w-full max-w-[min(78vw,460px)] flex justify-center mb-8 drop-shadow-2xl"
        >
          <Image
            alt="siZa."
            className="w-full h-auto max-h-[36vh] object-contain"
            height={1086}
            priority
            sizes="(max-width: 767px) 78vw, 460px"
            src="/assets/images/hero/Marshmallow%20home%20page%20hero.png"
            width={1448}
          />
        </div>

        {/* Replaces duplicate 'Get started' with clear guide to productive buttons below */}
        <div ref={ctaRef} className="pointer-events-auto">
          <FlowButton
            href="#main-content"
            variant="primary"
            size="lg"
            className="rounded-full shadow-2xl border-white/25 px-8 tracking-widest uppercase text-xs sm:text-sm font-bold min-h-[50px] hover:scale-105 active:scale-95"
            icon={<ChevronDown className="size-4 animate-bounce text-white" />}
            text={t("home.hero.guide")}
          />
        </div>
      </div>

      {/* Paragraph description (Top Right / Middle Right) */}
      <div
        className="hero-description absolute z-10 pointer-events-none select-none max-md:hidden"
        style={{
          position: "absolute",
          right: "60px",
          top: "360px",
          maxWidth: "420px",
          height: "auto",
          padding: "0px",
          fontSize: "12px",
          lineHeight: "1.6",
          textAlign: "right",
          textTransform: "uppercase",
          color: "#FFFFFF",
        }}
      >
        <p className="m-0 font-medium tracking-wide drop-shadow-md">
          {t("home.hero.description")}
        </p>
      </div>

      {/* Main Heading (Bottom Left-to-Right) */}
      <div
        className="hero-main-heading absolute z-10 pointer-events-none select-none flex items-end justify-between"
        style={{
          position: "absolute",
          bottom: "20px",
          left: "24px",
          right: "24px",
        }}
      >
        <h1 className="text-white font-extrabold tracking-tight text-[clamp(2.75rem,8.5vw,7.5rem)] leading-none text-left drop-shadow-lg m-0 p-0">
          siZa
        </h1>
      </div>
    </section>
  );
}
