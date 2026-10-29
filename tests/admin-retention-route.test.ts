import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  limitRequest: vi.fn(),
  limit: vi.fn(),
  sameOrigin: vi.fn(),
  requireAdmin: vi.fn(),
  purge: vi.fn(),
  prune: vi.fn(),
}));

vi.mock("@/server/security/request-rate-limit", () => ({ limitRequest: mocks.limitRequest, retryAfterHeaders: vi.fn((result: { retryAfterSeconds?: number }) => ({ "Retry-After": String(result.retryAfterSeconds ?? 60) })) }));
vi.mock("@/server/security/ratelimit", () => ({ limit: mocks.limit }));
vi.mock("@/server/security/origin", () => ({ sameOrigin: mocks.sameOrigin }));
vi.mock("@/server/policies/auth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/server/services/retention", () => ({ purgeExpiredHelperDocuments: mocks.purge, pruneExpiredRateLimitCounters: mocks.prune }));
vi.mock("@/server/db/admin", () => ({ createSupabaseAdminClient: vi.fn(() => ({})) }));
vi.mock("server-only", () => ({}));

import { POST } from "@/app/api/admin/retention/route";

function request() {
  return new NextRequest("http://localhost:3000/api/admin/retention", {
    method: "POST",
    headers: { origin: "http://localhost:3000" },
  });
}

describe("admin retention API response", () => {
  beforeEach(() => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "true");
    mocks.limitRequest.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 35 });
    mocks.limit.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 35 });
    mocks.sameOrigin.mockReset().mockReturnValue(true);
    mocks.requireAdmin.mockReset().mockResolvedValue({ userId: "admin-1" });
    mocks.purge.mockReset().mockResolvedValue({ deleted: 2 });
    mocks.prune.mockReset().mockResolvedValue(0);
  });

  it("returns a safe JSON 403 rather than propagating the auth redirect", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("NEXT_REDIRECT"));
    const response = await POST(request());
    expect(response.status).toBe(403);
    expect(response.headers.get("location")).toBeNull();
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: { code: "forbidden" } });
    expect(mocks.purge).not.toHaveBeenCalled();
  });

  it("returns a Retry-After header when retention is rate limited", async () => {
    mocks.limitRequest.mockResolvedValue({ allowed: false, retryAfterSeconds: 29 });
    const response = await POST(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("29");
    expect(mocks.purge).not.toHaveBeenCalled();
  });
});
