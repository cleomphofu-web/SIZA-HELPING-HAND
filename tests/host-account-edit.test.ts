import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import { hostAccountSchema, normaliseSaPhone } from "@/lib/schemas";
import { viewHostAccountForActor } from "@/server/views/host-account";
import { HostAccountForm } from "@/components/HostAccountForm";

const mocks = vi.hoisted(() => ({
  limit: vi.fn(),
  requireActor: vi.fn(),
  sameOrigin: vi.fn(),
  saveHostAccountDetails: vi.fn(),
}));

vi.mock("@/server/security/ratelimit", () => ({ limit: mocks.limit }));
vi.mock("@/server/security/request-rate-limit", () => ({ limitRequest: mocks.limit, retryAfterHeaders: vi.fn((result: { retryAfterSeconds?: number }) => ({ "Retry-After": String(result.retryAfterSeconds ?? 60) })) }));
vi.mock("@/server/policies/auth", () => ({ requireActor: mocks.requireActor }));
vi.mock("@/server/security/origin", () => ({ sameOrigin: mocks.sameOrigin }));
vi.mock("@/server/db/admin", () => ({ createSupabaseAdminClient: vi.fn(() => ({})) }));
vi.mock("@/server/services/phase-a", () => ({ saveHostAccountDetails: mocks.saveHostAccountDetails }));
vi.mock("server-only", () => ({}));

import { POST } from "@/app/api/host/account/route";

const account = { firstName: "Ada", lastName: "Example", phone: "082 123 4567" };

function request(fields: Record<string, string>, json = false) {
  return new NextRequest("http://localhost:3000/api/host/account", {
    method: "POST",
    headers: { origin: "http://localhost:3000", ...(json ? { "content-type": "application/json" } : {}) },
    body: json ? JSON.stringify(fields) : new URLSearchParams(fields),
  });
}

describe("host account details", () => {
  beforeEach(() => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "true");
    mocks.limit.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 60 });
    mocks.requireActor.mockReset().mockResolvedValue({ userId: "host-1", role: "host" });
    mocks.sameOrigin.mockReset().mockReturnValue(true);
    mocks.saveHostAccountDetails.mockReset().mockResolvedValue({ ok: true, data: { saved: true } });
  });

  it("trims names and stores the phone in normalized South African format", () => {
    const parsed = hostAccountSchema.safeParse({ firstName: " Ada ", lastName: " Example ", phone: "082 123 4567" });
    expect(parsed.success && parsed.data).toEqual({ firstName: "Ada", lastName: "Example", phone: "+27821234567" });
    expect(normaliseSaPhone("+27821234567")).toBe("+27821234567");
  });

  it("rejects invalid numbers and unexpected fields", () => {
    expect(hostAccountSchema.safeParse({ ...account, phone: "555" }).success).toBe(false);
    expect(hostAccountSchema.safeParse({ ...account, userId: "host-2" }).success).toBe(false);
  });

  it("returns contact details only to their host owner", () => {
    const record = { userId: "host-1", firstName: "Ada", lastName: "Example", phone: "+27821234567" };
    expect(viewHostAccountForActor(record, { userId: "host-1", role: "host" })).toEqual({ firstName: "Ada", lastName: "Example", phone: "+27821234567" });
    expect(viewHostAccountForActor(record, { userId: "host-2", role: "host" })).toBeNull();
    expect(viewHostAccountForActor(record, { userId: "host-1", role: "helper" })).toBeNull();
  });

  it("updates only the authenticated host and redirects without putting contact data in the URL", async () => {
    const response = await POST(request(account));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3000/app/profile?account=saved");
    expect(mocks.saveHostAccountDetails).toHaveBeenCalledWith(expect.anything(), "host-1", {
      firstName: "Ada", lastName: "Example", phone: "+27821234567",
    });
    expect(response.headers.get("location")).not.toContain(account.phone);
  });

  it("rejects a wrong role before calling the update service", async () => {
    mocks.requireActor.mockResolvedValue({ userId: "helper-1", role: "helper" });
    const response = await POST(request(account, true));
    expect(response.status).toBe(403);
    expect(mocks.saveHostAccountDetails).not.toHaveBeenCalled();
  });

  it("rejects a cross-origin form before calling the update service", async () => {
    mocks.sameOrigin.mockReturnValue(false);
    const response = await POST(request(account, true));
    expect(response.status).toBe(403);
    expect(mocks.saveHostAccountDetails).not.toHaveBeenCalled();
  });

  it("keeps the account mutation behind the prototype switch", async () => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "false");
    await expect(POST(request(account, true))).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    expect(mocks.limit).not.toHaveBeenCalled();
    expect(mocks.saveHostAccountDetails).not.toHaveBeenCalled();
  });

  it("rejects invalid phone input before calling the update service", async () => {
    const response = await POST(request({ ...account, phone: "555" }, true));
    expect(response.status).toBe(400);
    expect(mocks.saveHostAccountDetails).not.toHaveBeenCalled();
  });

  it("does not reveal whether a duplicate phone belongs to another account", async () => {
    mocks.saveHostAccountDetails.mockResolvedValue({ ok: false, error: { code: "conflict", message: "We could not save these details. Check them and try again." } });
    const response = await POST(request(account, true));
    const body = await response.json();
    expect(response.status).toBe(409);
    expect(JSON.stringify(body)).not.toContain(account.phone);
    expect(JSON.stringify(body)).not.toContain("another account");
  });

  it("shows generated copy and the current host contact values in the edit form", () => {
    const markup = renderToStaticMarkup(createElement(HostAccountForm, {
      account: { firstName: "Ada", lastName: "Example", phone: "+27821234567" },
      notice: "saved",
    }));
    expect(markup).toContain('action="/api/host/account"');
    expect(markup).toContain('name="firstName"');
    expect(markup).toContain('value="Ada"');
    expect(markup).toContain('type="tel"');
    expect(markup).toContain("Changes to your cell number are not verified with a code yet.");
    expect(markup).toContain("Your contact details have been saved.");
  });
});
