import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ create: vi.fn(), limit: vi.fn(), verify: vi.fn(), sameOrigin: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/admin", () => ({ createSupabaseAdminClient: vi.fn(() => ({})) }));
vi.mock("@/server/services/phase-a", () => ({ createPhaseABooking: mocks.create }));
vi.mock("@/server/security/request-rate-limit", () => ({
  limitRequest: mocks.limit,
  retryAfterHeaders: (result: { retryAfterSeconds?: number }) => ({ "Retry-After": String(result.retryAfterSeconds ?? 60) }),
}));
vi.mock("@/server/security/turnstile", () => ({ verifyTurnstile: mocks.verify }));
vi.mock("@/server/security/origin", () => ({ sameOrigin: mocks.sameOrigin }));
vi.mock("@/server/policies/auth", () => ({ requireActor: vi.fn(async () => ({ userId: "host-1", role: "host" })) }));

import { POST } from "@/app/api/bookings/route";

function makeRequest(fields: Record<string, string | string[]>) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    for (const item of Array.isArray(value) ? value : [value]) body.append(key, item);
  }
  return new NextRequest("http://localhost:3000/api/bookings", {
    method: "POST",
    headers: { origin: "http://localhost:3000" },
    body,
  });
}

const validFields = {
  addressLine: "1 Test Street",
  suburb: "Rosebank",
  city: "Johannesburg",
  services: ["home", "laundry"],
  primaryService: "home",
  bedrooms: "2",
  bathrooms: "1",
  sizeBand: "medium",
  addons: ["oven"],
  helpersNeeded: "1",
  startAt: "2030-01-01T10:00",
  genderPreference: "any",
  payPerHelperZar: "",
  transportPerHelperZar: "",
  accessNotes: "",
  idempotencyKey: "00000000-0000-4000-8000-000000000001",
  turnstileToken: "test-token",
  outsideAgreementNotice: "on",
  addressSharingNotice: "on",
  paymentNotice: "on",
};

describe("host booking route", () => {
  beforeEach(() => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "true");
    mocks.create.mockReset().mockResolvedValue({ ok: true, data: { id: "booking-1" } });
    mocks.limit.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 60 });
    mocks.verify.mockReset().mockResolvedValue(true);
    mocks.sameOrigin.mockReset().mockReturnValue(true);
  });

  it("passes only validated estimate inputs and turns a successful form into the request detail page", async () => {
    const response = await POST(makeRequest(validFields));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3000/app/requests/booking-1");
    expect(mocks.create).toHaveBeenCalledWith(expect.anything(), "host-1", expect.objectContaining({
      primaryService: "home",
      services: ["home", "laundry"],
      bedrooms: 2,
      bathrooms: 1,
      sizeBand: "medium",
      addons: ["oven"],
      genderPreference: "any",
      startAt: new Date("2030-01-01T08:00:00.000Z"),
    }));
    expect(mocks.create.mock.calls[0][2]).not.toHaveProperty("estimatedMinutes");
    expect(mocks.create.mock.calls[0][2]).not.toHaveProperty("endAt");
  });

  it("rejects client attempts to add calculated duration or amount fields", async () => {
    const response = await POST(makeRequest({ ...validFields, estimatedMinutes: "1", endAt: "2030-01-01T10:01", payPerHelperCents: "1" }));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3000/app/book?error=validation");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns the host to the form with a safe area error when service configuration is unavailable", async () => {
    mocks.create.mockResolvedValue({ ok: false, error: { code: "conflict", message: "private service error" } });
    const response = await POST(makeRequest(validFields));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3000/app/book?error=not_open");
  });

  it("does not call booking service for an invalid origin", async () => {
    mocks.sameOrigin.mockReturnValue(false);
    const response = await POST(makeRequest(validFields));
    expect(response.status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
