import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  requireAdminIdentity: vi.fn(),
  redirect: vi.fn(),
  listFactors: vi.fn(),
  getAuthenticatorAssuranceLevel: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/server/policies/auth", () => ({ requireAdminIdentity: mocks.requireAdminIdentity }));
vi.mock("@/app/(admin)/admin/mfa/actions", () => ({
  signOutFromAdminMfa: vi.fn(),
  startAdminMfaEnrollment: vi.fn(),
  verifyAdminMfa: vi.fn(),
  resetAdminMfaFactor: vi.fn(),
  getDevAdminTotpCode: vi.fn().mockResolvedValue(null),
}));

import AdminMfaPage from "@/app/(admin)/admin/mfa/page";

describe("admin MFA screen", () => {
  beforeEach(() => {
    mocks.redirect.mockReset().mockImplementation((path: string) => { throw new Error(`redirect:${path}`); });
    mocks.listFactors.mockReset().mockResolvedValue({ data: { totp: [] }, error: null });
    mocks.getAuthenticatorAssuranceLevel.mockReset().mockResolvedValue({ data: { currentLevel: "aal1" }, error: null });
    mocks.requireAdminIdentity.mockReset().mockResolvedValue({ supabase: { auth: { mfa: { listFactors: mocks.listFactors, getAuthenticatorAssuranceLevel: mocks.getAuthenticatorAssuranceLevel } } } });
  });

  // MFA enforcement disabled — /admin/mfa now immediately redirects to /admin for all sessions.
  it("redirects to /admin when no factor is enrolled, while MFA enforcement is disabled", async () => {
    await expect(AdminMfaPage({ searchParams: Promise.resolve({ setup: "1" }) })).rejects.toThrow("redirect:/admin");
  });

  // MFA enforcement disabled — the /admin/mfa page now redirects all sessions to /admin
  // because adminSessionRequiresMfa() always returns false.
  it("redirects an enrolled aal1 admin away from /admin/mfa while MFA is disabled", async () => {
    mocks.listFactors.mockResolvedValue({ data: { totp: [{ id: "factor-owned-by-admin", status: "verified" }] }, error: null });
    await expect(AdminMfaPage({ searchParams: Promise.resolve({ challenge: "1" }) })).rejects.toThrow("redirect:/admin");
  });

  it("redirects an aal2 admin away from the challenge screen", async () => {
    mocks.getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel: "aal2" }, error: null });
    await expect(AdminMfaPage({ searchParams: Promise.resolve({ challenge: "1" }) })).rejects.toThrow("redirect:/admin");
  });
});
