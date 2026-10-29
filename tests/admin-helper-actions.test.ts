import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  requireAdmin: vi.fn(),
  limitAdminAction: vi.fn(),
  actionOrigin: "http://localhost:3000" as string | null,
}));

vi.mock("@/server/db/admin", () => ({ createSupabaseAdminClient: () => ({ rpc: mocks.rpc }) }));
vi.mock("@/server/policies/auth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/server/security/admin-rate-limit", () => ({ limitAdminAction: mocks.limitAdminAction }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ ...(mocks.actionOrigin ? { origin: mocks.actionOrigin } : {}), host: "localhost:3000" }) }));
vi.mock("server-only", () => ({}));

import { approveHelper, rejectHelper, suspendHelper } from "@/app/(admin)/admin/helpers/actions";

const helperId = "7f45091d-23b7-4d7c-a3cf-fc70a6e38a26";
const checklist = { idMatchesSelfie: true as const, idReadable: true as const, referencesCalled: true as const };

describe("admin helper decision actions", () => {
  beforeEach(() => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "true");
    mocks.rpc.mockReset().mockResolvedValue({ data: true, error: null });
    mocks.requireAdmin.mockReset().mockResolvedValue({ userId: "admin-1" });
    mocks.limitAdminAction.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 30 });
    mocks.actionOrigin = "http://localhost:3000";
  });

  it("sends the verified actor and approval decision to one atomic database operation", async () => {
    await expect(approveHelper(helperId, checklist)).resolves.toEqual({ approved: true });
    expect(mocks.rpc).toHaveBeenCalledWith("admin_review_helper", {
      p_actor_id: "admin-1", p_helper_id: helperId, p_action: "approve", p_reason: null,
    });
  });

  it("sends decline and suspension reasons to the same atomic operation", async () => {
    await rejectHelper(helperId, "Incomplete application");
    await suspendHelper(helperId, "Safety review");
    expect(mocks.rpc).toHaveBeenNthCalledWith(1, "admin_review_helper", {
      p_actor_id: "admin-1", p_helper_id: helperId, p_action: "decline", p_reason: "Incomplete application",
    });
    expect(mocks.rpc).toHaveBeenNthCalledWith(2, "admin_review_helper", {
      p_actor_id: "admin-1", p_helper_id: helperId, p_action: "suspend", p_reason: "Safety review",
    });
  });

  it("does not report success when the atomic update-and-audit operation fails", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: new Error("database failure") });
    await expect(approveHelper(helperId, checklist)).rejects.toThrow("Could not approve helper");
  });

  it("rejects failed approval checks before reaching the database", async () => {
    await expect(approveHelper(helperId, { ...checklist, referencesCalled: false })).rejects.toThrow();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects an admin approval action with no Origin before authorization or database writes", async () => {
    mocks.actionOrigin = null;
    await expect(approveHelper(helperId, checklist)).rejects.toThrow();
    expect(mocks.requireAdmin).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
