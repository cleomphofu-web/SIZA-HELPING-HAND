import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ checkIn: vi.fn(), limit: vi.fn(), sameOrigin: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/admin", () => ({ createSupabaseAdminClient: vi.fn(() => ({})) }));
vi.mock("@/server/services/phase-a", () => ({ checkInPhaseABooking: mocks.checkIn }));
vi.mock("@/server/security/request-rate-limit", () => ({ limitRequest: mocks.limit }));
vi.mock("@/server/security/origin", () => ({ sameOrigin: mocks.sameOrigin }));
vi.mock("@/server/policies/auth", () => ({ requireActor: vi.fn(async () => ({ userId: "helper-1", role: "helper" })) }));

import { POST } from "@/app/api/helper/jobs/check-in/route";

function request() {
  return new NextRequest("http://localhost:3000/api/helper/jobs/check-in", {
    method: "POST",
    headers: { origin: "http://localhost:3000", "content-type": "application/json" },
    body: JSON.stringify({ bookingId: "7f45091d-23b7-4d7c-a3cf-fc70a6e38a26", code: "123456" }),
  });
}

describe("helper check-in route", () => {
  beforeEach(() => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "true");
    mocks.checkIn.mockReset().mockResolvedValue({ ok: true, data: { checkedIn: true } });
    mocks.limit.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 60 });
    mocks.sameOrigin.mockReset().mockReturnValue(true);
  });

  it("returns conflict for a wrong code before lockout and 423 only during an active lock", async () => {
    mocks.checkIn.mockResolvedValueOnce({ ok: false, error: { code: "conflict", message: "That code was not accepted." } });
    expect((await POST(request())).status).toBe(409);
    mocks.checkIn.mockResolvedValueOnce({ ok: false, error: { code: "locked", message: "Wait before trying again." } });
    expect((await POST(request())).status).toBe(423);
    expect(mocks.limit).toHaveBeenCalledWith("code_attempt", expect.anything());
    expect(mocks.checkIn).toHaveBeenCalledTimes(2);
  });

  it("keeps concealed resources hidden and maps unexpected failures to 500", async () => {
    mocks.checkIn.mockResolvedValueOnce({ ok: false, error: { code: "not_found", message: "This check-in is not available." } });
    expect((await POST(request())).status).toBe(404);
    mocks.checkIn.mockResolvedValueOnce({ ok: false, error: { code: "internal_error", message: "Try again." } });
    expect((await POST(request())).status).toBe(500);
  });
});
