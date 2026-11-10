"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import CloudSky from "@/components/originkit/ui/cloud-sky";
import { PublicHeader } from "@/components/PublicHeader";
import { HomeHeroActions } from "@/components/HomeHeroActions";
import { animateHero } from "@/lib/gsap";

type HomeHeroClientProps = {
  siteName: string;
  hostProps: {
    switchLabel: string;
    title: string;
    summary: string;
    action: string;
    secondary: string;
  };
  helperProps: {
    switchLabel: string;
    title: string;
    summary: string;
    action: string;
    secondary: string;
  };
};

export function HomeHeroClient({ siteName, hostProps, helperProps }: HomeHeroClientProps) {
  const wordmarkRef = useRef<HTMLDivElement | null>(null);
  const bgRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ctx = animateHero(wordmarkRef.current, bgRef.current, null);
    return () => ctx?.revert();
  }, []);

  return (
    <section
      aria-labelledby="hero-heading"
      className="home-hero relative min-h-screen overflow-hidden"
    >
      {/* Hidden h1 for accessibility — the visual H1 lives in HomeHeroActions */}
      <h1 id="hero-heading" className="sr-only">
        {siteName}
      </h1>

      <PublicHeader floating />

      {/* Full-bleed CloudSky background */}
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

      {/* Two-column layout: marshmallow LEFT, action panels RIGHT */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center min-h-screen pt-28 pb-12 lg:pt-28 lg:pb-12">
        {/* LEFT — Marshmallow image (56% desktop, full on mobile with reduced height) */}
        <div
          ref={wordmarkRef}
          className="
            flex items-center justify-center
            w-full lg:w-[56%]
            px-4 lg:px-6
            py-6 lg:py-0
            drop-shadow-2xl
            pointer-events-none
          "
          aria-hidden="true"
        >
          <Image
            alt=""
            className="
              w-auto h-auto
              max-w-[min(72vw,500px)] lg:max-w-none
              max-h-[38vh] lg:max-h-[72vh]
              object-contain
            "
            height={1086}
            priority
            sizes="(max-width: 1023px) 72vw, 50vw"
            src="/assets/images/hero/Marshmallow%20home%20page%20hero.png"
            width={1448}
          />
        </div>

        {/* RIGHT — Host / Helper action panels */}
        <div
          className="
            flex items-center justify-center
            w-full lg:w-[44%]
            px-6 sm:px-10 lg:px-12
            pt-4 pb-8 lg:py-0
            pointer-events-auto
          "
        >
          <div className="w-full max-w-sm lg:max-w-md">
            <HomeHeroActions host={hostProps} helper={helperProps} />
          </div>
        </div>
      </div>
    </section>
  );
}
