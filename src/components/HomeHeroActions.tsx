"use client";

import Link from "next/link";
import { useState } from "react";

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
        <span className="sr-only" id="home-hero-switch-label">{host.switchLabel} / {helper.switchLabel}</span>
        <button aria-pressed={audience === "host"} onClick={() => setAudience("host")} type="button">{host.switchLabel}</button>
        <button aria-pressed={audience === "helper"} onClick={() => setAudience("helper")} type="button">{helper.switchLabel}</button>
      </div>
      <h1 className="home-hero-title" id="home-title">{copy.title}</h1>
      <p className="home-hero-summary">{copy.summary}</p>
      <div className="home-hero-links">
        <Link className="home-hero-primary" href={audience === "host" ? "/request" : "/apply"}>{copy.action}</Link>
        <Link className="home-hero-secondary" href={audience === "host" ? "#how-it-works" : "#helpers"}>{copy.secondary}</Link>
      </div>
    </div>
  );
}
