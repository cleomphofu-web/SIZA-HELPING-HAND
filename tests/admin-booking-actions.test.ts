import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  limitAdminAction: vi.fn(),
  assignAdminShortlistedHelpers: vi.fn(),
  loadAdminShortlistRows: vi.fn(),
  setAdminBookingStatus: vi.fn(),
  origin: "http://localhost:3000" as string | null,
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers({ ...(mocks.origin ? { origin: mocks.origin } : {}), host: "localhost:3000" }) }));
vi.mock("@/server/policies/auth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/server/security/admin-rate-limit", () => ({ limitAdminAction: mocks.limitAdminAction }));
vi.mock("@/server/services/admin-assignments", () => ({ assignAdminShortlistedHelpers: mocks.assignAdminShortlistedHelpers, loadAdminShortlistRows: mocks.loadAdminShortlistRows, setAdminBookingStatus: mocks.setAdminBookingStatus }));
vi.mock("server-only", () => ({}));

import { assignHelpers, setBookingStatus } from "@/app/(admin)/admin/bookings/actions";

describe("admin booking actions origin guard", () => {
  beforeEach(() => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "true");
    mocks.origin = "http://localhost:3000";
    mocks.requireAdmin.mockReset().mockResolvedValue({ userId: "admin-1" });
    mocks.limitAdminAction.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 60 });
    mocks.assignAdminShortlistedHelpers.mockReset().mockResolvedValue({ ok: true, data: { assigned: true } });
    mocks.setAdminBookingStatus.mockReset().mockResolvedValue({ ok: true, data: { updated: true } });
    mocks.loadAdminShortlistRows.mockReset().mockResolvedValue({ ok: true, data: [] });
  });

  it("blocks helper assignment when Origin is absent before admin authorization and writes", async () => {
    mocks.origin = null;
    await expect(assignHelpers("123e4567-e89b-42d3-a456-426614174000", { version: "a".repeat(64), indexes: [0] })).resolves.toMatchObject({ ok: false });
    expect(mocks.requireAdmin).not.toHaveBeenCalled();
    expect(mocks.assignAdminShortlistedHelpers).not.toHaveBeenCalled();
  });

  it("blocks booking status changes from a mismatched Origin", async () => {
    mocks.origin = "https://attacker.example";
    await expect(setBookingStatus("123e4567-e89b-42d3-a456-426614174000", "cancelled")).resolves.toMatchObject({ ok: false });
    expect(mocks.requireAdmin).not.toHaveBeenCalled();
    expect(mocks.setAdminBookingStatus).not.toHaveBeenCalled();
  });
});
