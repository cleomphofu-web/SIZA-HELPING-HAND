import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ confirm: vi.fn(), limit: vi.fn(), sameOrigin: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/admin", () => ({ createSupabaseAdminClient: vi.fn(() => ({})) }));
vi.mock("@/server/services/phase-a", () => ({ confirmPhaseABooking: mocks.confirm }));
vi.mock("@/server/security/request-rate-limit", () => ({ limitRequest: mocks.limit }));
vi.mock("@/server/security/origin", () => ({ sameOrigin: mocks.sameOrigin }));
vi.mock("@/server/policies/auth", () => ({ requireActor: vi.fn(async () => ({ userId: "host-1", role: "host" })) }));

import { POST } from "@/app/api/bookings/confirm/route";

function request(json = true) {
  return new NextRequest("http://localhost:3000/api/bookings/confirm", {
    method: "POST",
    headers: { origin: "http://localhost:3000", ...(json ? { "content-type": "application/json" } : {}) },
    body: json ? JSON.stringify({ bookingId: "7f45091d-23b7-4d7c-a3cf-fc70a6e38a26" }) : new URLSearchParams({ bookingId: "7f45091d-23b7-4d7c-a3cf-fc70a6e38a26" }),
  });
}

describe("booking confirmation route", () => {
  beforeEach(() => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "true");
    mocks.confirm.mockReset().mockResolvedValue({ ok: true, data: { confirmed: true } });
    mocks.limit.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 60 });
    mocks.sameOrigin.mockReset().mockReturnValue(true);
  });

  it("uses the booking rate-limit bucket and maps a premature confirmation to conflict", async () => {
    mocks.confirm.mockResolvedValue({ ok: false, error: { code: "conflict", message: "This job is not ready to be confirmed." } });
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(mocks.limit).toHaveBeenCalledWith("booking", expect.anything());
    expect(mocks.confirm).toHaveBeenCalledOnce();
  });

  it("keeps participant denials and hidden resources at their documented HTTP status", async () => {
    mocks.confirm.mockResolvedValueOnce({ ok: false, error: { code: "forbidden", message: "Only a booking participant can confirm it." } });
    expect((await POST(request())).status).toBe(403);
    mocks.confirm.mockResolvedValueOnce({ ok: false, error: { code: "not_found", message: "We could not find that booking." } });
    expect((await POST(request())).status).toBe(404);
  });

  it("redirects a successful form confirmation back to the actor's booking", async () => {
    const response = await POST(request(false));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3000/app/requests/7f45091d-23b7-4d7c-a3cf-fc70a6e38a26");
  });
});
