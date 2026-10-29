import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  supabase: {
    auth: {
      mfa: {
        listFactors: vi.fn(),
        unenroll: vi.fn(),
        enroll: vi.fn(),
        challenge: vi.fn(),
        verify: vi.fn(),
      },
      signOut: vi.fn(),
    },
  },
  requireAdminIdentity: vi.fn(),
  requirePrototypeRoutes: vi.fn(),
  limitAdminAction: vi.fn(),
  limitAdminMfaVerification: vi.fn(),
  reserveAdminMfaCode: vi.fn(),
  actionOrigin: "http://localhost:3000" as string | null,
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ ...(mocks.actionOrigin ? { origin: mocks.actionOrigin } : {}), host: "localhost:3000" }) }));
vi.mock("@/server/policies/auth", () => ({ requireAdminIdentity: mocks.requireAdminIdentity }));
vi.mock("@/server/policies/prototype", () => ({ requirePrototypeRoutes: mocks.requirePrototypeRoutes }));
vi.mock("@/server/security/admin-rate-limit", () => ({ limitAdminAction: mocks.limitAdminAction, limitAdminMfaVerification: mocks.limitAdminMfaVerification }));
vi.mock("@/server/services/admin-mfa-replay", () => ({ reserveAdminMfaCode: mocks.reserveAdminMfaCode }));

import { startAdminMfaEnrollment, verifyAdminMfa } from "@/app/(admin)/admin/mfa/actions";

function formData(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("admin authenticator actions", () => {
  beforeEach(() => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "true");
    mocks.requireAdminIdentity.mockReset().mockResolvedValue({ userId: "admin-1", supabase: mocks.supabase });
    mocks.requirePrototypeRoutes.mockReset();
    mocks.limitAdminAction.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 60 });
    mocks.limitAdminMfaVerification.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 900 });
    mocks.reserveAdminMfaCode.mockReset().mockResolvedValue(true);
    mocks.actionOrigin = "http://localhost:3000";
    mocks.supabase.auth.mfa.listFactors.mockReset().mockResolvedValue({ data: { totp: [] }, error: null });
    mocks.supabase.auth.mfa.unenroll.mockReset().mockResolvedValue({ error: null });
    mocks.supabase.auth.mfa.enroll.mockReset().mockResolvedValue({ data: { id: "11111111-1111-4111-8111-111111111111", totp: { secret: "TEST-SECRET" } }, error: null });
    mocks.supabase.auth.mfa.challenge.mockReset().mockResolvedValue({ data: { id: "challenge-1" }, error: null });
    mocks.supabase.auth.mfa.verify.mockReset().mockResolvedValue({ error: null });
  });

  it("creates an authenticator setup secret only for the signed-in admin", async () => {
    const state = await startAdminMfaEnrollment(null, formData({ intent: "setup" }));
    expect(state).toEqual({ enrollment: { factorId: "11111111-1111-4111-8111-111111111111", secret: "TEST-SECRET" } });
    expect(mocks.supabase.auth.mfa.enroll).toHaveBeenCalledWith({ factorType: "totp", friendlyName: "SIZA admin authenticator" });
  });

  it("clears abandoned unverified factors before creating a new setup", async () => {
    mocks.supabase.auth.mfa.listFactors.mockResolvedValue({ data: { totp: [{ id: "old-unverified", status: "unverified" }] }, error: null });
    await startAdminMfaEnrollment(null, formData({ intent: "setup" }));
    expect(mocks.supabase.auth.mfa.unenroll).toHaveBeenCalledWith({ factorId: "old-unverified" });
    expect(mocks.supabase.auth.mfa.enroll).toHaveBeenCalledOnce();
  });

  it("does not replace an already verified authenticator", async () => {
    mocks.supabase.auth.mfa.listFactors.mockResolvedValue({ data: { totp: [{ id: "verified", status: "verified" }] }, error: null });
    const state = await startAdminMfaEnrollment(null, formData({ intent: "setup" }));
    expect(state).toHaveProperty("error");
    expect(mocks.supabase.auth.mfa.enroll).not.toHaveBeenCalled();
  });

  it("rejects a factor id that does not belong to the signed-in admin", async () => {
    mocks.supabase.auth.mfa.listFactors.mockResolvedValue({ data: { totp: [{ id: "22222222-2222-4222-8222-222222222222", status: "verified" }] }, error: null });
    await expect(verifyAdminMfa(formData({ factorId: "11111111-1111-4111-8111-111111111111", code: "123456" }))).rejects.toThrow("redirect:/admin/mfa?error=invalid");
    expect(mocks.supabase.auth.mfa.challenge).not.toHaveBeenCalled();
  });

  it("challenges and verifies the admin's factor before redirecting to the admin home", async () => {
    mocks.supabase.auth.mfa.listFactors.mockResolvedValue({ data: { totp: [{ id: "11111111-1111-4111-8111-111111111111", status: "verified" }] }, error: null });
    await expect(verifyAdminMfa(formData({ factorId: "11111111-1111-4111-8111-111111111111", code: "123456" }))).rejects.toThrow("redirect:/admin");
    expect(mocks.supabase.auth.mfa.challenge).toHaveBeenCalledWith({ factorId: "11111111-1111-4111-8111-111111111111" });
    expect(mocks.reserveAdminMfaCode).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111", "123456");
    expect(mocks.reserveAdminMfaCode.mock.invocationCallOrder[0]).toBeLessThan(mocks.supabase.auth.mfa.verify.mock.invocationCallOrder[0]!);
    expect(mocks.supabase.auth.mfa.verify).toHaveBeenCalledWith({ factorId: "11111111-1111-4111-8111-111111111111", challengeId: "challenge-1", code: "123456" });
  });

  it("rejects malformed one-time codes before asking Supabase to verify", async () => {
    await expect(verifyAdminMfa(formData({ factorId: "11111111-1111-4111-8111-111111111111", code: "bad" }))).rejects.toThrow("redirect:/admin/mfa?error=invalid");
    expect(mocks.supabase.auth.mfa.verify).not.toHaveBeenCalled();
  });

  it("uses a dedicated MFA verification limit and does not attempt a code when it is exhausted", async () => {
    mocks.limitAdminMfaVerification.mockResolvedValue({ allowed: false, retryAfterSeconds: 417 });
    await expect(verifyAdminMfa(formData({ factorId: "11111111-1111-4111-8111-111111111111", code: "123456" }))).rejects.toThrow("redirect:/admin/mfa?error=invalid");
    expect(mocks.limitAdminMfaVerification).toHaveBeenCalledOnce();
    expect(mocks.limitAdminAction).not.toHaveBeenCalled();
    expect(mocks.supabase.auth.mfa.verify).not.toHaveBeenCalled();
  });

  it("reserves a TOTP code before Supabase verification and denies a replay", async () => {
    mocks.supabase.auth.mfa.listFactors.mockResolvedValue({ data: { totp: [{ id: "11111111-1111-4111-8111-111111111111", status: "verified" }] }, error: null });
    mocks.reserveAdminMfaCode.mockResolvedValue(false);
    await expect(verifyAdminMfa(formData({ factorId: "11111111-1111-4111-8111-111111111111", code: "123456" }))).rejects.toThrow("redirect:/admin/mfa?error=invalid");
    expect(mocks.reserveAdminMfaCode).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111", "123456");
    expect(mocks.supabase.auth.mfa.verify).not.toHaveBeenCalled();
  });

  it("rejects a Server Action with no Origin before challenging or verifying a factor", async () => {
    mocks.actionOrigin = null;
    mocks.supabase.auth.mfa.listFactors.mockResolvedValue({ data: { totp: [{ id: "11111111-1111-4111-8111-111111111111", status: "verified" }] }, error: null });
    await expect(verifyAdminMfa(formData({ factorId: "11111111-1111-4111-8111-111111111111", code: "123456" }))).rejects.toThrow("redirect:/admin/mfa?error=invalid");
    expect(mocks.supabase.auth.mfa.challenge).not.toHaveBeenCalled();
    expect(mocks.reserveAdminMfaCode).not.toHaveBeenCalled();
    expect(mocks.supabase.auth.mfa.verify).not.toHaveBeenCalled();
  });
});
