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
}));

import AdminMfaPage from "@/app/(admin)/admin/mfa/page";

describe("admin MFA screen", () => {
  beforeEach(() => {
    mocks.redirect.mockReset().mockImplementation((path: string) => { throw new Error(`redirect:${path}`); });
    mocks.listFactors.mockReset().mockResolvedValue({ data: { totp: [] }, error: null });
    mocks.getAuthenticatorAssuranceLevel.mockReset().mockResolvedValue({ data: { currentLevel: "aal1" }, error: null });
    mocks.requireAdminIdentity.mockReset().mockResolvedValue({ supabase: { auth: { mfa: { listFactors: mocks.listFactors, getAuthenticatorAssuranceLevel: mocks.getAuthenticatorAssuranceLevel } } } });
  });

  it("shows enrollment as a password-signed-in admin with no verified factor", async () => {
    const html = renderToStaticMarkup(await AdminMfaPage({ searchParams: Promise.resolve({ setup: "1" }) }));
    expect(html).toContain("Protect your admin account");
    expect(html).toContain("Add an authenticator app to your admin account.");
    expect(html).toContain('name="intent" value="setup"');
    expect(html).not.toContain("factorId");
  });

  it("shows a code challenge for an enrolled admin with an aal1 session", async () => {
    mocks.listFactors.mockResolvedValue({ data: { totp: [{ id: "factor-owned-by-admin", status: "verified" }] }, error: null });
    const html = renderToStaticMarkup(await AdminMfaPage({ searchParams: Promise.resolve({ challenge: "1" }) }));
    expect(html).toContain('name="factorId" value="factor-owned-by-admin"');
    expect(html).toContain('name="code"');
    expect(html).toContain("Enter the six-digit code from your authenticator app.");
  });

  it("redirects an aal2 admin away from the challenge screen", async () => {
    mocks.getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel: "aal2" }, error: null });
    await expect(AdminMfaPage({ searchParams: Promise.resolve({ challenge: "1" }) })).rejects.toThrow("redirect:/admin");
  });
});
