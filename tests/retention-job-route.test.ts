import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  prototype: vi.fn(),
  rate: vi.fn(),
  purge: vi.fn(),
  prune: vi.fn(),
  expireBookings: vi.fn(),
  lapseSubscriptions: vi.fn(),
  pruneOffers: vi.fn(),
  autoRelease: vi.fn(),
  processEmails: vi.fn(),
  order: [] as string[],
}));

vi.mock("@/server/policies/prototype", () => ({ requirePrototypeRoutes: () => { mocks.order.push("prototype"); mocks.prototype(); } }));
vi.mock("@/server/config/env", () => ({ env: { get MAINTENANCE_JOB_SECRET() { return process.env.MAINTENANCE_JOB_SECRET; } } }));
vi.mock("@/server/security/request-rate-limit", () => ({
  limitRequest: mocks.rate,
  retryAfterHeaders: (result: { retryAfterSeconds?: number }) => ({ "Retry-After": String(result.retryAfterSeconds ?? 60) }),
}));
vi.mock("@/server/services/retention", () => ({
  purgeExpiredHelperDocuments: mocks.purge,
  pruneExpiredRateLimitCounters: mocks.prune,
  expireOpenBookings: mocks.expireBookings,
  lapseExpiredSubscriptions: mocks.lapseSubscriptions,
  pruneExpiredBookingOffers: mocks.pruneOffers,
  autoReleaseBookings: mocks.autoRelease,
  processPendingEmails: mocks.processEmails,
}));
vi.mock("@/server/db/admin", () => ({ createSupabaseAdminClient: vi.fn(() => ({})) }));
vi.mock("server-only", () => ({}));

import { POST } from "@/app/api/jobs/retention/route";

function request(authorization?: string) {
  return new NextRequest("http://localhost:3000/api/jobs/retention", {
    method: "POST",
    headers: authorization ? { authorization } : undefined,
  });
}

describe("retention job API", () => {
  beforeEach(() => {
    vi.stubEnv("MAINTENANCE_JOB_SECRET", "a-test-maintenance-secret-that-is-long-enough");
    mocks.order.length = 0;
    mocks.prototype.mockReset();
    mocks.rate.mockReset().mockImplementation(async () => { mocks.order.push("rate"); return { allowed: true }; });
    mocks.purge.mockReset().mockResolvedValue({ deleted: 2, failed: 0 });
    mocks.prune.mockReset().mockResolvedValue(0);
    mocks.expireBookings.mockReset().mockResolvedValue(0);
    mocks.lapseSubscriptions.mockReset().mockResolvedValue(0);
    mocks.pruneOffers.mockReset().mockResolvedValue(0);
    mocks.autoRelease.mockReset().mockResolvedValue(0);
    mocks.processEmails.mockReset().mockResolvedValue({ processed: 0, sent: 0, failed: 0 });
  });

  it("runs the prototype guard and rate limit before authorizing the job secret", async () => {
    vi.stubEnv("MAINTENANCE_JOB_SECRET", "");
    const response = await POST(request("Bearer wrong-secret"));
    expect(response.status).toBe(403);
    expect(mocks.prototype).toHaveBeenCalled();
    expect(mocks.rate).toHaveBeenCalledOnce();
    expect(mocks.purge).not.toHaveBeenCalled();
  });

  it("denies a missing or incorrect secret without revealing which check failed", async () => {
    const missing = await POST(request());
    const incorrect = await POST(request("Bearer wrong-secret"));
    expect(missing.status).toBe(403);
    expect(incorrect.status).toBe(403);
    await expect(missing.json()).resolves.toEqual(await incorrect.json());
    expect(mocks.purge).not.toHaveBeenCalled();
  });

  it("runs retention only for the configured bearer secret", async () => {
    const response = await POST(request("Bearer a-test-maintenance-secret-that-is-long-enough"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: {
        deleted: 2,
        failed: 0,
        rateLimitCountersPruned: 0,
        bookingsExpired: 0,
        subscriptionsLapsed: 0,
        offersPruned: 0,
        bookingsAutoReleased: 0,
        emailsProcessed: { processed: 0, sent: 0, failed: 0 },
      },
    });
    expect(mocks.order).toEqual(["prototype", "rate"]);
    expect(mocks.purge).toHaveBeenCalledOnce();
  });

  it("rejects request bodies and query parameters", async () => {
    const bodyRequest = new NextRequest("http://localhost:3000/api/jobs/retention", {
      method: "POST",
      headers: { authorization: "Bearer a-test-maintenance-secret-that-is-long-enough" },
      body: "unexpected",
    });
    const queryRequest = new NextRequest("http://localhost:3000/api/jobs/retention?force=true", {
      method: "POST",
      headers: { authorization: "Bearer a-test-maintenance-secret-that-is-long-enough" },
    });
    const malformedLengthRequest = new NextRequest("http://localhost:3000/api/jobs/retention", {
      method: "POST",
      headers: { authorization: "Bearer a-test-maintenance-secret-that-is-long-enough", "content-length": "invalid" },
    });
    expect((await POST(bodyRequest)).status).toBe(400);
    expect((await POST(queryRequest)).status).toBe(400);
    expect((await POST(malformedLengthRequest)).status).toBe(400);
    expect(mocks.purge).not.toHaveBeenCalled();
  });

  it("stops before authorization when rate limited", async () => {
    mocks.rate.mockResolvedValue({ allowed: false, retryAfterSeconds: 21 });
    const response = await POST(request("Bearer a-test-maintenance-secret-that-is-long-enough"));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("21");
    expect(mocks.purge).not.toHaveBeenCalled();
  });
});
