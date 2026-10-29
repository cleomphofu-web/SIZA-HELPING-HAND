import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import { helperGenderMatchPreferenceSchema } from "@/lib/schemas";
import { HelperGenderMatchingForm } from "@/components/HelperGenderMatchingForm";
import { t } from "@/content/t";

const mocks = vi.hoisted(() => ({
  limit: vi.fn(),
  requireActor: vi.fn(),
  assertRole: vi.fn(),
  sameOrigin: vi.fn(),
  savePreference: vi.fn(),
  matchingEnabled: vi.fn(),
}));

vi.mock("@/server/security/request-rate-limit", () => ({ limitRequest: mocks.limit }));
vi.mock("@/server/policies/auth", () => ({ requireActor: mocks.requireActor }));
vi.mock("@/server/policies/authorization", () => ({ assertRole: mocks.assertRole }));
vi.mock("@/server/security/origin", () => ({ sameOrigin: mocks.sameOrigin }));
vi.mock("@/server/db/admin", () => ({ createSupabaseAdminClient: vi.fn(() => ({})) }));
vi.mock("@/server/services/helper-matching", () => ({ saveHelperGenderMatchingPreference: mocks.savePreference, isHelperGenderMatchingEnabled: mocks.matchingEnabled }));
vi.mock("server-only", () => ({}));

import { POST } from "@/app/api/helper/profile/matching-preference/route";

function request(fields: Record<string, unknown>, json = true) {
  return new NextRequest("http://localhost:3000/api/helper/profile/matching-preference", {
    method: "POST",
    headers: { origin: "http://localhost:3000", ...(json ? { "content-type": "application/json" } : {}) },
    body: json ? JSON.stringify(fields) : new URLSearchParams(fields as Record<string, string>),
  });
}

describe("helper gender matching preference", () => {
  beforeEach(() => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "true");
    mocks.limit.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 60 });
    mocks.requireActor.mockReset().mockResolvedValue({ userId: "helper-1", role: "helper" });
    mocks.assertRole.mockReset().mockImplementation((actor: { role: string }, role: string) => {
      if (actor.role !== role) throw new Error("wrong role");
    });
    mocks.sameOrigin.mockReset().mockReturnValue(true);
    mocks.savePreference.mockReset().mockResolvedValue({ ok: true, data: { saved: true } });
    mocks.matchingEnabled.mockReset().mockResolvedValue(true);
  });

  it("requires explicit opt-in for a matching category and rejects unexpected identity fields", () => {
    expect(helperGenderMatchPreferenceSchema.safeParse({ genderMatchGroup: "female", consent: true }).success).toBe(true);
    expect(helperGenderMatchPreferenceSchema.safeParse({ genderMatchGroup: "female", consent: false }).success).toBe(false);
    expect(helperGenderMatchPreferenceSchema.safeParse({ genderMatchGroup: "none", consent: false }).success).toBe(true);
    expect(helperGenderMatchPreferenceSchema.safeParse({ genderMatchGroup: "non_binary", consent: true }).success).toBe(false);
    expect(helperGenderMatchPreferenceSchema.safeParse({ genderMatchGroup: "male", consent: true, userId: "helper-2" }).success).toBe(false);
  });

  it("saves only the signed-in helper's opt-in choice", async () => {
    const response = await POST(request({ genderMatchGroup: "female", consent: true }));
    expect(response.status).toBe(200);
    expect(mocks.savePreference).toHaveBeenCalledWith(expect.anything(), "helper-1", "female");
  });

  it("keeps the preference unavailable until the privacy gate is enabled", async () => {
    mocks.matchingEnabled.mockResolvedValue(false);
    const response = await POST(request({ genderMatchGroup: "female", consent: true }));
    expect(response.status).toBe(409);
    expect(mocks.savePreference).not.toHaveBeenCalled();
  });

  it("lets a helper clear their matching choice", async () => {
    const response = await POST(request({ genderMatchGroup: "none", consent: false }));
    expect(response.status).toBe(200);
    expect(mocks.savePreference).toHaveBeenCalledWith(expect.anything(), "helper-1", null);
  });

  it("rejects unexpected identity fields at the API boundary", async () => {
    const response = await POST(request({ genderMatchGroup: "female", consent: true, userId: "helper-2" }));
    expect(response.status).toBe(400);
    expect(mocks.savePreference).not.toHaveBeenCalled();
  });

  it("does not call the service when the actor has the wrong role", async () => {
    mocks.requireActor.mockResolvedValue({ userId: "host-1", role: "host" });
    const response = await POST(request({ genderMatchGroup: "female", consent: true }));
    expect(response.status).toBe(403);
    expect(mocks.savePreference).not.toHaveBeenCalled();
  });

  it("rejects cross-origin preference changes", async () => {
    mocks.sameOrigin.mockReturnValue(false);
    const response = await POST(request({ genderMatchGroup: "female", consent: true }));
    expect(response.status).toBe(403);
    expect(mocks.savePreference).not.toHaveBeenCalled();
  });

  it("blocks the route before rate limiting when the prototype switch is off", async () => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "false");
    await expect(POST(request({ genderMatchGroup: "female", consent: true }))).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    expect(mocks.limit).not.toHaveBeenCalled();
    expect(mocks.savePreference).not.toHaveBeenCalled();
  });

  it("does not render gender as public profile content and explains that the match is soft", () => {
    const markup = renderToStaticMarkup(createElement(HelperGenderMatchingForm, {
      enabled: true,
      currentGroup: "female",
      status: "saved",
    }));
    expect(markup).toContain('action="/api/helper/profile/matching-preference"');
    expect(markup).toContain("hosts will not see this choice");
    expect(markup).toContain("you can still be offered other jobs");
  });

  it("does not render a collection form while the privacy gate is closed", () => {
    const markup = renderToStaticMarkup(createElement(HelperGenderMatchingForm, { enabled: false, currentGroup: null }));
    expect(markup).not.toContain('action="/api/helper/profile/matching-preference"');
    expect(markup).toContain(t("helper.matching.unavailable"));
  });
});
