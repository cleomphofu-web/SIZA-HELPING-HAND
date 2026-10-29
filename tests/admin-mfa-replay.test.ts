import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/server/config/env", () => ({ env: { SUPABASE_SERVICE_ROLE_KEY: "test-mfa-hmac-key" } }));
vi.mock("@/server/db/admin", () => ({ createSupabaseAdminClient: () => ({ rpc: mocks.rpc }) }));

import { hashAdminMfaCode, reserveAdminMfaCode } from "@/server/services/admin-mfa-replay";

describe("admin MFA replay reservation", () => {
  beforeEach(() => mocks.rpc.mockReset().mockResolvedValue({ data: true, error: null }));

  it("creates a stable keyed digest that does not reveal the submitted code", () => {
    const digest = hashAdminMfaCode("11111111-1111-4111-8111-111111111111", "123456");
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(digest).not.toContain("123456");
    expect(hashAdminMfaCode("11111111-1111-4111-8111-111111111111", "123456")).toBe(digest);
    expect(hashAdminMfaCode("22222222-2222-4222-8222-222222222222", "123456")).not.toBe(digest);
  });

  it("fails closed unless Postgres reserves the code digest", async () => {
    const factorId = "11111111-1111-4111-8111-111111111111";
    expect(await reserveAdminMfaCode(factorId, "123456")).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("reserve_admin_mfa_code", {
      p_factor_id: factorId,
      p_code_hash: hashAdminMfaCode(factorId, "123456"),
    });

    mocks.rpc.mockResolvedValueOnce({ data: false, error: null });
    expect(await reserveAdminMfaCode(factorId, "123456")).toBe(false);
    mocks.rpc.mockResolvedValueOnce({ data: null, error: new Error("database unavailable") });
    expect(await reserveAdminMfaCode(factorId, "654321")).toBe(false);
  });
});
