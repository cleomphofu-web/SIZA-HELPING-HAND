import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createSupabaseServerClient: vi.fn(), limit: vi.fn() }));

vi.mock("@/server/db/server", () => ({ createSupabaseServerClient: mocks.createSupabaseServerClient }));
vi.mock("@/server/security/ratelimit", () => ({ limit: mocks.limit }));
vi.mock("server-only", () => ({}));

import { limitRequest, retryAfterHeaders } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";

describe("request rate-limit helpers", () => {
  beforeEach(() => {
    mocks.createSupabaseServerClient.mockReset();
    mocks.limit.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 30 });
  });

  it("keys an authenticated request by its verified Supabase user id", async () => {
    mocks.createSupabaseServerClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "host-1" } } }) } });
    await limitRequest("booking", new Request("http://localhost", { headers: { "x-real-ip": "203.0.113.7" } }));
    expect(mocks.limit).toHaveBeenCalledWith("booking", "host-1");
  });

  it("falls back to the trusted request IP when the request is anonymous", async () => {
    mocks.createSupabaseServerClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } });
    await limitRequest("report", new Request("http://localhost", { headers: { "x-real-ip": "203.0.113.7", "x-forwarded-for": "198.51.100.1" } }));
    expect(mocks.limit).toHaveBeenCalledWith("report", "203.0.113.7");
  });

  it("fails back to the request IP if session lookup fails", async () => {
    mocks.createSupabaseServerClient.mockRejectedValue(new Error("session unavailable"));
    await limitRequest("upload", new Request("http://localhost", { headers: { "x-forwarded-for": "198.51.100.4, 10.0.0.1" } }));
    expect(mocks.limit).toHaveBeenCalledWith("upload", "198.51.100.4");
  });

  it("always returns a positive Retry-After value", () => {
    expect(retryAfterHeaders({ retryAfterSeconds: 12.8 })).toEqual({ "Retry-After": "12" });
    expect(retryAfterHeaders({})).toEqual({ "Retry-After": "60" });
    expect(retryAfterHeaders({ retryAfterSeconds: 0 })).toEqual({ "Retry-After": "1" });
  });

  it("returns one consistent 429 JSON envelope and Retry-After header", async () => {
    const response = rateLimitResponse({ retryAfterSeconds: 24 });
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("24");
    await expect(response.json()).resolves.toEqual({ ok: false, error: { code: "rate_limited", message: "Please try again later." } });
  });
});
