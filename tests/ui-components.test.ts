import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FlowButton } from "@/components/ui/flow-button";
import {
  MapMarkerTooltip,
  JohannesburgTrackingCard,
} from "@/components/ui/map-marker-tooltip";
import {
  SignInPageLayout,
  defaultMarketplaceTestimonials,
} from "@/components/ui/sign-in";

describe("FlowButton Component", () => {
  it("renders button with text and trailing arrow icon", () => {
    const html = renderToStaticMarkup(
      createElement(FlowButton, { text: "Request a helper" })
    );

    expect(html).toContain("<button");
    expect(html).toContain("Request a helper");
    expect(html).toContain("svg"); // Arrow icon
  });

  it("renders as Next.js Link when href is provided", () => {
    const html = renderToStaticMarkup(
      createElement(FlowButton, {
        href: "/request",
        text: "Book Now",
      })
    );

    expect(html).toContain('href="/request"');
    expect(html).toContain("Book Now");
  });

  it("displays loading spinner and disables button when loading is true", () => {
    const html = renderToStaticMarkup(
      createElement(FlowButton, {
        loading: true,
        text: "Submitting...",
      })
    );

    expect(html).toContain("disabled");
    expect(html).toContain("animate-spin");
    expect(html).toContain("Submitting...");
  });

  it("applies fullWidth and variant classes appropriately", () => {
    const html = renderToStaticMarkup(
      createElement(FlowButton, {
        variant: "emerald",
        fullWidth: true,
        text: "Confirm",
      })
    );

    expect(html).toContain("w-full");
    expect(html).toContain("bg-emerald-600");
  });
});

describe("MapMarkerTooltip Component", () => {
  it("renders accessible marker pin with live beacon", () => {
    const html = renderToStaticMarkup(
      createElement(MapMarkerTooltip, {
        title: "Sandton Central",
        subtitle: "Sandton, Johannesburg",
        statusText: "Helper on the way",
        etaMinutes: 12,
        isLive: true,
      })
    );

    expect(html).toContain("Sandton Central");
    expect(html).toContain("Helper on the way");
    expect(html).toContain("~12 min");
    expect(html).toContain("animate-ping"); // Live beacon ring
  });

  it("JohannesburgTrackingCard renders card layout with embedded marker", () => {
    const html = renderToStaticMarkup(
      createElement(JohannesburgTrackingCard, {
        suburb: "Rosebank",
        helperName: "Thabo",
        etaMinutes: 10,
        isLive: true,
      })
    );

    expect(html).toContain("Rosebank");
    expect(html).toContain("Thabo is on the way");
    expect(html).toContain("Live Helper Location");
    expect(html).toContain("jhb-grid"); // SVG decorative map pattern
  });
});

describe("SignInPageLayout Component", () => {
  it("renders auth form child inside split layout", () => {
    const html = renderToStaticMarkup(
      createElement(
        SignInPageLayout,
        { role: "host", mode: "login" },
        createElement("div", { id: "test-auth-form" }, "Test Form")
      )
    );

    expect(html).toContain('id="test-auth-form"');
    expect(html).toContain("Test Form");
    expect(html).toContain("Verified Helpers");
  });

  it("includes default authentic Johannesburg testimonials and trust indicators", () => {
    const html = renderToStaticMarkup(
      createElement(
        SignInPageLayout,
        { testimonials: defaultMarketplaceTestimonials },
        createElement("div", null, "Login")
      )
    );

    expect(html).toContain(defaultMarketplaceTestimonials[0].name);
    expect(html).toContain(defaultMarketplaceTestimonials[0].suburb);
    expect(html).toContain("Direct Phone &amp; WhatsApp");
    expect(html).toContain("4-Digit Check-In Codes");
  });
});

