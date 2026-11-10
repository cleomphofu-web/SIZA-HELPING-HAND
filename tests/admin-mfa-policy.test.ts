import { describe, expect, it } from "vitest";
import { adminPostLoginDestination, adminSessionRequiresMfa } from "@/server/services/admin-mfa";

describe("admin MFA access policy", () => {
  it("routes non-admin accounts away from the admin surface", () => {
    expect(adminPostLoginDestination({ role: "helper", isMember: false, hasVerifiedTotp: false, currentLevel: "aal1" })).toBe("/admin/login?error=invalid");
  });

  // MFA enforcement is currently disabled — all valid admins go straight to /admin.
  // These tests document the DISABLED state and will be restored when MFA is re-enabled.
  it("sends a valid admin straight to /admin while MFA is disabled (no TOTP factor)", () => {
    expect(adminPostLoginDestination({ role: "admin", isMember: true, hasVerifiedTotp: false, currentLevel: "aal1" })).toBe("/admin");
  });

  it("sends a valid admin straight to /admin while MFA is disabled (aal1 session)", () => {
    expect(adminPostLoginDestination({ role: "admin", isMember: true, hasVerifiedTotp: true, currentLevel: "aal1" })).toBe("/admin");
  });

  it("sends a valid admin straight to /admin while MFA is disabled (aal2 session)", () => {
    expect(adminPostLoginDestination({ role: "admin", isMember: true, hasVerifiedTotp: true, currentLevel: "aal2" })).toBe("/admin");
  });

  it("adminSessionRequiresMfa always returns false while enforcement is disabled", () => {
    expect(adminSessionRequiresMfa("aal1")).toBe(false);
    expect(adminSessionRequiresMfa("aal2")).toBe(false);
    expect(adminSessionRequiresMfa(null)).toBe(false);
  });
});
