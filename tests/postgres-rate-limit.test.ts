import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/server/db/admin", () => ({ createSupabaseAdminClient: () => ({ rpc: mocks.rpc }) }));
vi.mock("@/server/config/env", () => ({ env: { SUPABASE_SERVICE_ROLE_KEY: "test-only-service-role-secret" } }));
vi.mock("server-only", () => ({}));

import { limit } from "@/server/security/ratelimit";
import { inspectLoginThrottle, recordFailedLogin, recordSuccessfulLogin } from "@/server/security/login-limiter";

describe("Postgres rate limiter", () => {
  beforeEach(() => mocks.rpc.mockReset());

  it("stores only an HMAC subject digest and uses the database bucket configuration", async () => {
    mocks.rpc.mockResolvedValue({ data: { allowed: true, retry_after_seconds: 45 }, error: null });
    await expect(limit("booking", "203.0.113.41")).resolves.toEqual({ allowed: true, retryAfterSeconds: 45 });
    expect(mocks.rpc).toHaveBeenCalledWith("consume_rate_limit", expect.objectContaining({ p_bucket: "booking" }));
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain("203.0.113.41");
  });

  it("fails closed with a generic retry when Postgres cannot enforce a limit", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: new Error("database detail must not escape") });
    await expect(limit("booking", "203.0.113.41")).resolves.toEqual({ allowed: false, retryAfterSeconds: 60 });
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain("database detail");
  });
});

describe("login throttle privacy and decisions", () => {
  beforeEach(() => mocks.rpc.mockReset());

  it("checks the account/IP pair and account challenge using digests only", async () => {
    mocks.rpc.mockResolvedValue({ data: { locked: true, challenge_required: true, retry_after_seconds: 300 }, error: null });
    await expect(inspectLoginThrottle(" Helper@Example.test ", "203.0.113.41")).resolves.toEqual({
      locked: true,
      challengeRequired: true,
      retryAfterSeconds: 300,
    });
    expect(mocks.rpc).toHaveBeenCalledWith("login_throttle_status", expect.any(Object));
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain("Helper@Example.test");
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain("203.0.113.41");
  });

  it("records failures and clears both counters after successful sign-in", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    await expect(recordFailedLogin("helper@example.test", "203.0.113.41")).resolves.toBe(true);
    expect(mocks.rpc).toHaveBeenNthCalledWith(1, "record_login_failure", expect.any(Object));
    await expect(recordSuccessfulLogin("helper@example.test", "203.0.113.41")).resolves.toBe(true);
    expect(mocks.rpc).toHaveBeenNthCalledWith(2, "clear_login_failures", expect.any(Object));
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain("helper@example.test");
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain("203.0.113.41");
  });

  it("fails closed when the login counter check fails", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: new Error("private database error") });
    await expect(inspectLoginThrottle("helper@example.test", "203.0.113.41")).rejects.toThrow("login_limiter_unavailable");
  });
});
