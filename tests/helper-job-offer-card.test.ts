import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HelperJobOfferCard } from "@/components/HelperJobOfferCard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("HelperJobOfferCard Component", () => {
  const sampleOffer = {
    id: "booking-123",
    suburb: "Centurion",
    slot: 1,
    payPerHelperCents: 24000,
    transportPerHelperCents: 5000,
    services: ["home_cleaning"],
    startAt: "2026-11-10T08:00:00Z",
    endAt: "2026-11-10T12:00:00Z",
    expiresAt: new Date(Date.now() + 60000).toISOString(),
  };

  it("renders suburb, slot, and net payout correctly", () => {
    const html = renderToStaticMarkup(
      createElement(HelperJobOfferCard, {
        offer: sampleOffer,
      })
    );

    expect(html).toContain("Centurion");
    expect(html).toContain("Slot #1");
    expect(html).toContain("R290");
    expect(html).toContain("NET");
    expect(html).toContain("R240 wage + R50 transport");
  });

  it("renders direct payment assurance and fair rotation banner", () => {
    const html = renderToStaticMarkup(
      createElement(HelperJobOfferCard, {
        offer: sampleOffer,
      })
    );

    expect(html).toContain("Fair Rotation Offer");
    expect(html).toContain("100% direct payment · Zero commission / no agency cut");
  });

  it("renders service badge and schedule duration estimate", () => {
    const html = renderToStaticMarkup(
      createElement(HelperJobOfferCard, {
        offer: sampleOffer,
      })
    );

    expect(html).toContain("home cleaning");
    expect(html).toContain("~4 hrs");
  });

  it("renders action buttons: Accept Job and Pass", () => {
    const html = renderToStaticMarkup(
      createElement(HelperJobOfferCard, {
        offer: sampleOffer,
      })
    );

    expect(html).toContain("Accept Job (R290)");
    expect(html).toContain("Pass");
  });

  it("renders countdown progress bar with ARIA attributes", () => {
    const html = renderToStaticMarkup(
      createElement(HelperJobOfferCard, {
        offer: sampleOffer,
        initialSeconds: 45,
      })
    );

    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuemin="0"');
  });

  it("renders expired state when timer reaches zero or expiresAt is in the past", () => {
    const expiredOffer = {
      ...sampleOffer,
      expiresAt: new Date(Date.now() - 5000).toISOString(),
    };

    const html = renderToStaticMarkup(
      createElement(HelperJobOfferCard, {
        offer: expiredOffer,
      })
    );

    expect(html).toContain("Accept window expired");
    expect(html).toContain("Dismiss");
  });
});

