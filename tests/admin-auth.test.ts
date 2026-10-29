import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
  role: "admin" as string,
  deletedAt: null as string | null,
  member: true,
  currentLevel: "aal1" as "aal1" | "aal2",
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/server", () => ({ createSupabaseServerClient: mocks.createSupabaseServerClient }));
vi.mock("@/server/db/admin", () => ({ createSupabaseAdminClient: mocks.createSupabaseAdminClient }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));

import { requireActor, requireAdmin, requireAdminIdentity } from "@/server/policies/auth";

describe("admin session authorization", () => {
  beforeEach(() => {
    mocks.role = "admin";
    mocks.deletedAt = null;
    mocks.member = true;
    mocks.currentLevel = "aal1";
    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } } }),
        mfa: { getAuthenticatorAssuranceLevel: vi.fn().mockImplementation(async () => ({ data: { currentLevel: mocks.currentLevel }, error: null })) },
      },
      from: vi.fn(() => ({ select: vi.fn(function (this: unknown) { return this; }), eq: vi.fn(function (this: unknown) { return this; }), maybeSingle: vi.fn(async () => ({ data: { role: mocks.role, deleted_at: mocks.deletedAt }, error: null })) })),
    });
    mocks.createSupabaseAdminClient.mockReturnValue({ from: vi.fn((table: string) => ({
      select: vi.fn(function (this: unknown) { return this; }),
      eq: vi.fn(function (this: unknown) { return this; }),
      maybeSingle: vi.fn(async () => table === "profiles" ? { data: { role: mocks.role, deleted_at: mocks.deletedAt }, error: null } : { data: mocks.member ? { user_id: "admin-1" } : null, error: null }),
    })) });
  });

  it("allows an active admin identity to enter MFA setup before aal2", async () => {
    await expect(requireAdminIdentity()).resolves.toMatchObject({ userId: "admin-1" });
  });

  it("redirects an aal1 admin away from protected pages and actions", async () => {
    await expect(requireAdmin()).rejects.toThrow("redirect:/admin/mfa?challenge=1");
  });

  it("allows an admin only after the session reaches aal2", async () => {
    mocks.currentLevel = "aal2";
    await expect(requireAdmin()).resolves.toEqual({ userId: "admin-1" });
  });

  it("blocks aal1 admin actors from server read seams", async () => {
    await expect(requireActor()).rejects.toThrow("admin_mfa_required");
  });

  it("blocks deleted admin actors from server read seams even with aal2 and membership", async () => {
    mocks.currentLevel = "aal2";
    mocks.deletedAt = "2026-10-27T00:00:00.000Z";
    await expect(requireActor()).rejects.toThrow("unauthenticated");
  });

  it("blocks admin actors without an admins membership from server read seams", async () => {
    mocks.currentLevel = "aal2";
    mocks.member = false;
    await expect(requireActor()).rejects.toThrow("unauthenticated");
  });

  it("denies deleted admin identities even when membership remains", async () => {
    mocks.deletedAt = "2026-10-27T00:00:00.000Z";
    await expect(requireAdminIdentity()).rejects.toThrow("redirect:/admin/login?error=unauthorised");
  });

  it("denies profile admins without an admins membership row", async () => {
    mocks.member = false;
    await expect(requireAdminIdentity()).rejects.toThrow("redirect:/admin/login?error=unauthorised");
  });
});
