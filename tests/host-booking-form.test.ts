import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HostBookingForm } from "@/components/HostBookingForm";
import type { HostBookingFormView } from "@/server/views/booking-form";

const config: HostBookingFormView = {
  services: [{
    service: "home",
    hourlyCents: "3600",
    perBedroomMinutes: 30,
    perBathroomMinutes: 20,
    sizeBandMinutes: { small: 15, medium: 30, large: 60 },
    addonMinutes: { oven: 20 },
  }],
  areas: [{ suburb: "Rosebank", transportCents: "5000", serviceKeys: ["home"], serviceSets: [{ services: ["home"], eligibleHelperCount: 3 }] }],
  floorPercent: 100,
  genderMatchingEnabled: true,
};

const profile = { addressLine: "1 Test Street", suburb: "Rosebank", city: "Johannesburg", notesDefault: "Gate code" };

describe("host booking request form", () => {
  it("renders the request fields and requires a distinct review before submission", () => {
    const markup = renderToStaticMarkup(createElement(HostBookingForm, {
      profile,
      config,
      turnstileSiteKey: "site-key",
      idempotencyKey: "00000000-0000-4000-8000-000000000001",
    }));
    expect(markup).toContain("Home cleaning");
    expect(markup).toContain('name="bedrooms"');
    expect(markup).toContain('name="bathrooms"');
    expect(markup).toContain('name="sizeBand"');
    expect(markup).toContain('name="genderPreference"');
    expect(markup).toContain('name="payPerHelperZar"');
    expect(markup).toContain('name="transportPerHelperZar"');
    expect(markup).not.toContain('name="estimatedMinutes"');
    expect(markup).not.toContain('name="endAt"');
    expect(markup).toContain("Your address is shared with the helper(s) assigned to you.");
    expect(markup).toMatch(/type="button"[^>]*>Review request/);
    expect(markup).toContain('aria-labelledby="host-book-review-title"');
    expect(markup).toMatch(/type="submit"[^>]*>Confirm request/);
    const helperSelect = markup.match(/<select name="helpersNeeded"[\s\S]*?<\/select>/)?.[0] ?? "";
    expect(helperSelect).toContain('<option value="3">3</option>');
    expect(helperSelect).not.toContain('<option value="4">4</option>');
  });

  it("keeps the request action disabled when configured rates, areas, or Turnstile are missing", () => {
    const markup = renderToStaticMarkup(createElement(HostBookingForm, {
      profile,
      config: { services: [], areas: [], floorPercent: null, genderMatchingEnabled: false },
      turnstileSiteKey: "",
      idempotencyKey: "00000000-0000-4000-8000-000000000001",
    }));
    expect(markup).toContain("This service or area is not open for requests yet.");
    expect(markup).toContain("Turnstile is not configured");
    expect(markup).toMatch(/<button[^>]*disabled=""/);
  });

  it("does not collect a host gender preference while matching privacy approval is pending", () => {
    const markup = renderToStaticMarkup(createElement(HostBookingForm, {
      profile,
      config: { ...config, genderMatchingEnabled: false },
      turnstileSiteKey: "site-key",
      idempotencyKey: "00000000-0000-4000-8000-000000000001",
    }));
    expect(markup).not.toContain('type="radio" name="genderPreference"');
    expect(markup).toContain('name="genderPreference"');
    expect(markup).toContain('value="any"');
  });
});
