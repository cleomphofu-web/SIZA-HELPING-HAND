"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import CloudSky from "@/components/originkit/ui/cloud-sky";
import { PublicHeader } from "@/components/PublicHeader";
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

        <div ref={ctaRef} className="pointer-events-auto">
          <Link
            href="/request"
            className="inline-flex items-center justify-center min-h-[50px] px-9 py-3.5 rounded-full bg-black text-white font-bold text-xs sm:text-sm tracking-widest uppercase hover:bg-neutral-800 hover:scale-105 active:scale-95 transition-all shadow-2xl border border-white/20"
          >
            {t("home.hero.get_started")}
          </Link>
        </div>
      </div>
    </section>
  );
}
