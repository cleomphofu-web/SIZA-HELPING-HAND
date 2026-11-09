"use client";

import { useState } from "react";
import { FlowButton } from "@/components/ui/flow-button";
import Link from "next/link";

type Audience = {
  switchLabel: string;
  title: string;
  summary: string;
  action: string;
  secondary: string;
};

type HomeHeroActionsProps = {
  host: Audience;
  helper: Audience;
};

export function HomeHeroActions({ host, helper }: HomeHeroActionsProps) {
  const [audience, setAudience] = useState<"host" | "helper">("host");
  const copy = audience === "host" ? host : helper;

  return (
    <div className="home-hero-actions">
      {/* Audience toggle — drives title/summary swap only */}
      <div aria-labelledby="home-hero-switch-label" className="home-hero-switch" role="group">
        <span className="sr-only" id="home-hero-switch-label">
          {host.switchLabel} / {helper.switchLabel}
        </span>
        <button
          aria-pressed={audience === "host"}
          onClick={() => setAudience("host")}
          type="button"
          className="transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
        >
          {host.switchLabel}
        </button>
        <button
          aria-pressed={audience === "helper"}
          onClick={() => setAudience("helper")}
          type="button"
          className="transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
        >
          {helper.switchLabel}
        </button>
      </div>

      {/* H1 is in the hero section above; this is an h2 panel heading */}
      <h2 className="home-hero-title" id="home-title">
        {copy.title}
      </h2>
      <p className="home-hero-summary">{copy.summary}</p>

      {/* Single primary CTA per audience */}
      <div className="home-hero-links flex flex-col items-center gap-3 w-full max-w-xs mx-auto">
        <FlowButton
          href={audience === "host" ? "/request" : "/apply"}
          variant="primary"
          size="md"
          className="home-hero-primary w-full"
          text={copy.action}
        />
        {/* Low-weight secondary: plain underlined link, not a full button */}
        <Link
          href={audience === "host" ? "#how-it-works" : "#helpers"}
          className="text-sm text-neutral-500 underline underline-offset-2 hover:text-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded"
        >
          {copy.secondary}
        </Link>
      </div>
    </div>
  );
}
