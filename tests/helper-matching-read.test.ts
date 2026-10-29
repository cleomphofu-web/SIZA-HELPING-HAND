import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireActor: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/policies/auth", () => ({ requireActor: mocks.requireActor }));
vi.mock("@/server/db/admin", () => ({
  createSupabaseAdminClient: () => ({ from: () => ({ select: mocks.select, eq: mocks.eq, maybeSingle: mocks.maybeSingle }) }),
}));

import { getOwnHelperMatchingView } from "@/server/views/helper-matching-read";

describe("private helper matching preference reader", () => {
  beforeEach(() => {
    mocks.requireActor.mockReset();
    mocks.select.mockReset().mockReturnThis();
    mocks.eq.mockReset().mockReturnThis();
    mocks.maybeSingle.mockReset()
      .mockResolvedValueOnce({ data: { gender_match_group: "female" }, error: null })
      .mockResolvedValueOnce({ data: { value: true }, error: null });
  });

  it("reads only the signed-in helper's private matching group", async () => {
    mocks.requireActor.mockResolvedValue({ userId: "helper-own", role: "helper" });
    const result = await getOwnHelperMatchingView();
    expect(result).toEqual({ ok: true, data: { enabled: true, genderMatchGroup: "female" } });
    expect(mocks.select).toHaveBeenCalledWith("gender_match_group");
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "helper-own");
    expect(JSON.stringify(result)).not.toContain("userId");
  });

  it("does not query the setting for a host or admin", async () => {
    mocks.requireActor.mockResolvedValue({ userId: "host-own", role: "host" });
    const result = await getOwnHelperMatchingView();
    expect(result).toEqual({ ok: false, error: { code: "not_found", message: "We could not find this profile." } });
    expect(mocks.select).not.toHaveBeenCalled();
  });

  it("withholds a saved category while the privacy gate is closed", async () => {
    mocks.requireActor.mockResolvedValue({ userId: "helper-own", role: "helper" });
    mocks.maybeSingle.mockReset()
      .mockResolvedValueOnce({ data: { gender_match_group: "female" }, error: null })
      .mockResolvedValueOnce({ data: { value: false }, error: null });
    await expect(getOwnHelperMatchingView()).resolves.toEqual({ ok: true, data: { enabled: false, genderMatchGroup: null } });
  });
});
