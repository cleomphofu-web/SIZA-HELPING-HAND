import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ resolve: vi.fn(), limit: vi.fn(), sameOrigin: vi.fn(), actor: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/admin", () => ({ createSupabaseAdminClient: vi.fn(() => ({})) }));
vi.mock("@/server/services/phase-a", () => ({ resolvePhaseANoShowSlot: mocks.resolve }));
vi.mock("@/server/security/request-rate-limit", () => ({ limitRequest: mocks.limit }));
vi.mock("@/server/security/origin", () => ({ sameOrigin: mocks.sameOrigin }));
vi.mock("@/server/policies/auth", () => ({ requireActor: mocks.actor }));

import { POST } from "@/app/api/bookings/no-show-resolution/route";

const payload = { bookingId: "7f45091d-23b7-4d7c-a3cf-fc70a6e38a26", slot: 2, resolution: "close_vacant_slot" };
const request = (body: unknown = payload) => new NextRequest("http://localhost:3000/api/bookings/no-show-resolution", {
  method: "POST",
  headers: { origin: "http://localhost:3000", "content-type": "application/json" },
  body: JSON.stringify(body),
});
const formRequest = () => new NextRequest("http://localhost:3000/api/bookings/no-show-resolution", {
  method: "POST",
  headers: { origin: "http://localhost:3000", "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ bookingId: payload.bookingId, slot: "2", resolution: "close_vacant_slot" }),
});

describe("host no-show slot resolution route", () => {
  beforeEach(() => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "true");
    mocks.resolve.mockReset().mockResolvedValue({ ok: true, data: { closed: true } });
    mocks.limit.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 60 });
    mocks.sameOrigin.mockReset().mockReturnValue(true);
    mocks.actor.mockReset().mockResolvedValue({ userId: "host-1", role: "host" });
  });

  it("uses the booking limiter and passes only the validated host decision to the service", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(mocks.limit).toHaveBeenCalledWith("booking", expect.anything());
    expect(mocks.resolve).toHaveBeenCalledWith({}, "host-1", payload);
  });

  it("redirects a successful native host form back to its request", async () => {
    const response = await POST(formRequest());
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3000/app/requests/7f45091d-23b7-4d7c-a3cf-fc70a6e38a26");
  });

  it("rejects an invalid resolution without calling the service", async () => {
    const response = await POST(request({ ...payload, resolution: "cancel_everything" }));
    expect(response.status).toBe(400);
    expect(mocks.resolve).not.toHaveBeenCalled();
  });

  it("blocks non-host actors and cross-origin calls", async () => {
    mocks.actor.mockResolvedValueOnce({ userId: "helper-1", role: "helper" });
    expect((await POST(request())).status).toBe(403);
    mocks.sameOrigin.mockReturnValue(false);
    expect((await POST(request())).status).toBe(403);
    expect(mocks.resolve).not.toHaveBeenCalled();
  });
});
