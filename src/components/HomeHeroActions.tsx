"use client";

import { useState } from "react";
import { FlowButton } from "@/components/ui/flow-button";

type HomeHeroActionsProps = {
  host: { switchLabel: string; title: string; summary: string; action: string; secondary: string };
  helper: { switchLabel: string; title: string; summary: string; action: string; secondary: string };
};

export function HomeHeroActions({ host, helper }: HomeHeroActionsProps) {
  const [audience, setAudience] = useState<"host" | "helper">("host");
  const copy = audience === "host" ? host : helper;

  return (
    <div className="home-hero-actions">
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
      <h1 className="home-hero-title" id="home-title">{copy.title}</h1>
      <p className="home-hero-summary">{copy.summary}</p>
      <div className="home-hero-links flex flex-wrap justify-center gap-3 w-full max-w-md mx-auto">
        <FlowButton
          href={audience === "host" ? "/request" : "/apply"}
          variant="primary"
          size="md"
          className="home-hero-primary"
          text={copy.action}
        />
        <FlowButton
          href={audience === "host" ? "#how-it-works" : "#helpers"}
          variant="secondary"
          size="md"
          className="home-hero-secondary"
          text={copy.secondary}
        />
      </div>
    </div>
  );
}
