import { describe, expect, it } from "vitest";
import { buildHostBookingFormView } from "@/server/views/booking-form";

const helper = (services: string[], overrides: Partial<{
  status: string;
  role: string;
  suburbs: string[];
  first_job_completed_at: string | null;
  subscription_status: string;
  subscription_paid_until: string | null;
}> = {}) => ({
  role: "helper",
  status: "approved",
  suburbs: ["Rosebank"],
  services,
  first_job_completed_at: null,
  subscription_status: "none",
  subscription_paid_until: null,
  ...overrides,
});

describe("host booking form view", () => {
  it("exposes configured services and areas with three approved eligible helpers", () => {
    const view = buildHostBookingFormView({
      categories: [
        { name: "home", enabled: true, pricing: "rate_card" },
        { name: "office", enabled: false, pricing: "rate_card" },
        { name: "quote", enabled: true, pricing: "quote" },
      ],
      rates: [
        { service: "home", hourly_cents: "3600", per_bedroom_minutes: 30, per_bathroom_minutes: 20, size_band_minutes: { small: 15, medium: 30, large: 60 }, addon_minutes: { oven: 20 } },
        { service: "office", hourly_cents: "5000", per_bedroom_minutes: 0, per_bathroom_minutes: 0, size_band_minutes: {}, addon_minutes: {} },
        { service: "quote", hourly_cents: "0", per_bedroom_minutes: 0, per_bathroom_minutes: 0, size_band_minutes: {}, addon_minutes: {} },
      ],
      zones: [
        { suburb: "Rosebank", transport_cents: "5000", enabled: true },
        { suburb: "Invalid amount", transport_cents: "-1", enabled: true },
        { suburb: "Vanderbijlpark", transport_cents: "8000", enabled: true },
        { suburb: "Closed", transport_cents: "0", enabled: false },
      ],
      approvedHelpers: [helper(["home"]), helper(["home"]), helper(["home"]), helper(["office"]), helper(["home", "office"], { status: "pending" })],
      floorPercent: 100,
    });

    expect(view.services.map((service) => service.service)).toEqual(["home"]);
    expect(view.areas).toEqual([{ suburb: "Rosebank", transportCents: "5000", serviceKeys: ["home"], serviceSets: [{ services: ["home"], eligibleHelperCount: 3 }] }]);
    expect(JSON.stringify(view)).not.toContain("userId");
  });

  it("does not expose a service area without three matching helpers", () => {
    const view = buildHostBookingFormView({
      categories: [{ name: "home", enabled: true, pricing: "rate_card" }],
      rates: [{ service: "home", hourly_cents: "3600", per_bedroom_minutes: 30, per_bathroom_minutes: 20, size_band_minutes: { small: 15 }, addon_minutes: {} }],
      zones: [{ suburb: "Rosebank", transport_cents: "5000", enabled: true }],
      approvedHelpers: [helper(["home"]), helper(["home"])],
      floorPercent: 100,
    });
    expect(view.areas).toEqual([]);
  });

  it("requires three currently eligible helpers for each complete selected-service combination", () => {
    const view = buildHostBookingFormView({
      categories: [{ name: "home", enabled: true, pricing: "rate_card" }, { name: "laundry", enabled: true, pricing: "rate_card" }],
      rates: [
        { service: "home", hourly_cents: "3600", per_bedroom_minutes: 30, per_bathroom_minutes: 20, size_band_minutes: { small: 15, medium: 30, large: 60 }, addon_minutes: {} },
        { service: "laundry", hourly_cents: "2400", per_bedroom_minutes: 0, per_bathroom_minutes: 0, size_band_minutes: { small: 0, medium: 0, large: 0 }, addon_minutes: {} },
      ],
      zones: [{ suburb: "Rosebank", transport_cents: "5000", enabled: true }],
      approvedHelpers: [
        helper(["home"]), helper(["home"]), helper(["home"]),
        helper(["laundry"]), helper(["laundry"]), helper(["laundry"]),
        ...Array.from({ length: 3 }, () => helper(["home", "laundry"], {
          first_job_completed_at: "2026-01-01T00:00:00Z",
          subscription_status: "active",
          subscription_paid_until: "2026-10-25T00:00:00Z",
        })),
        ...Array.from({ length: 3 }, () => helper(["home", "laundry"], {
          first_job_completed_at: "2026-01-01T00:00:00Z",
          subscription_status: "active",
          subscription_paid_until: "2026-10-23T00:00:00Z",
        })),
      ],
      floorPercent: 100,
      now: new Date("2026-10-24T00:00:00Z"),
    });
    expect(view.areas[0]?.serviceSets).toEqual([
      { services: ["home"], eligibleHelperCount: 6 },
      { services: ["laundry"], eligibleHelperCount: 6 },
      { services: ["home", "laundry"], eligibleHelperCount: 3 },
    ]);
  });
});
