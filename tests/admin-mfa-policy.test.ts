import { describe, expect, it } from "vitest";
import { adminPostLoginDestination, adminSessionRequiresMfa } from "@/server/services/admin-mfa";

describe("admin MFA access policy", () => {
  it("routes non-admin accounts away from the admin surface", () => {
    expect(adminPostLoginDestination({ role: "helper", isMember: false, hasVerifiedTotp: false, currentLevel: "aal1" })).toBe("/admin/login?error=invalid");
  });

  it("requires setup when an admin has no verified TOTP factor", () => {
    expect(adminPostLoginDestination({ role: "admin", isMember: true, hasVerifiedTotp: false, currentLevel: "aal1" })).toBe("/admin/mfa?setup=1");
  });

  it("requires a challenge for an enrolled admin with an aal1 session", () => {
    expect(adminPostLoginDestination({ role: "admin", isMember: true, hasVerifiedTotp: true, currentLevel: "aal1" })).toBe("/admin/mfa?challenge=1");
  });

  it("allows a verified admin with an aal2 session", () => {
    expect(adminPostLoginDestination({ role: "admin", isMember: true, hasVerifiedTotp: true, currentLevel: "aal2" })).toBe("/admin");
  });

  it("requires aal2 for every protected admin action and read", () => {
    expect(adminSessionRequiresMfa("aal1")).toBe(true);
    expect(adminSessionRequiresMfa("aal2")).toBe(false);
    expect(adminSessionRequiresMfa(null)).toBe(true);
  });
});
