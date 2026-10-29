import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
  profileRole: "admin" as string,
  hasAdminMembership: true,
  hasVerifiedTotp: false,
  assuranceLevel: "aal1" as "aal1" | "aal2",
  inspectLoginThrottle: vi.fn(),
  recordFailedLogin: vi.fn(),
  recordSuccessfulLogin: vi.fn(),
  sameOrigin: vi.fn(),
  verifyTurnstile: vi.fn(),
}));

vi.mock("@/server/db/server", () => ({ createSupabaseServerClient: mocks.createSupabaseServerClient }));
vi.mock("@/server/db/admin", () => ({ createSupabaseAdminClient: mocks.createSupabaseAdminClient }));
vi.mock("@/server/config/env", () => ({ env: { SUPABASE_SERVICE_ROLE_KEY: "test-only-service-role-secret" } }));
vi.mock("@/server/security/login-limiter", () => ({ inspectLoginThrottle: mocks.inspectLoginThrottle, recordFailedLogin: mocks.recordFailedLogin, recordSuccessfulLogin: mocks.recordSuccessfulLogin }));
vi.mock("@/server/security/origin", () => ({ sameOrigin: mocks.sameOrigin }));
vi.mock("@/server/security/turnstile", () => ({ verifyTurnstile: mocks.verifyTurnstile }));
vi.mock("server-only", () => ({}));

import { POST } from "@/app/api/admin/login/route";

function request(fields: Record<string, string> = {}) {
  const body = new FormData();
  body.set("email", "owner@example.test");
  body.set("password", "test-password");
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  return new NextRequest("http://localhost:3000/api/admin/login", {
    method: "POST",
    headers: { origin: "http://localhost:3000" },
    body,
  });
}

describe("admin login Postgres throttle", () => {
  beforeEach(() => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "true");
    mocks.profileRole = "admin";
    mocks.hasAdminMembership = true;
    mocks.hasVerifiedTotp = false;
    mocks.assuranceLevel = "aal1";
    const auth = {
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: "admin-user" } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      mfa: {
        listFactors: vi.fn().mockImplementation(async () => ({ data: { totp: mocks.hasVerifiedTotp ? [{ id: "factor-1", status: "verified" }] : [] }, error: null })),
        getAuthenticatorAssuranceLevel: vi.fn().mockImplementation(async () => ({ data: { currentLevel: mocks.assuranceLevel }, error: null })),
      },
    };
    mocks.createSupabaseServerClient.mockReset().mockResolvedValue({ auth });
    mocks.createSupabaseAdminClient.mockReset().mockReturnValue({ from: vi.fn((table: string) => {
      const query = { select: vi.fn(() => query), eq: vi.fn(() => query), maybeSingle: vi.fn(async () => table === "profiles" ? { data: { role: mocks.profileRole, deleted_at: null }, error: null } : { data: mocks.hasAdminMembership ? { user_id: "admin-user" } : null, error: null }) };
      return query;
    }) });
    mocks.inspectLoginThrottle.mockReset().mockResolvedValue({ locked: false, challengeRequired: false, retryAfterSeconds: 60 });
    mocks.recordFailedLogin.mockReset().mockResolvedValue(true);
    mocks.recordSuccessfulLogin.mockReset().mockResolvedValue(true);
    mocks.sameOrigin.mockReset().mockReturnValue(true);
    mocks.verifyTurnstile.mockReset().mockResolvedValue(true);
  });

  it("sends a first-time admin to authenticator setup after password sign-in", async () => {
    const response = await POST(request());
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3000/admin/mfa?setup=1");
    expect(mocks.verifyTurnstile).not.toHaveBeenCalled();
    expect(mocks.recordSuccessfulLogin).toHaveBeenCalledWith("owner@example.test", "unknown");
  });

  it("sends an enrolled admin with an aal1 session to a TOTP challenge", async () => {
    mocks.hasVerifiedTotp = true;
    const response = await POST(request());
    expect(response.headers.get("location")).toBe("http://localhost:3000/admin/mfa?challenge=1");
  });

  it("lets only an enrolled aal2 admin continue to the admin home", async () => {
    mocks.hasVerifiedTotp = true;
    mocks.assuranceLevel = "aal2";
    const response = await POST(request());
    expect(response.headers.get("location")).toBe("http://localhost:3000/admin");
  });

  it("signs out a non-admin account that uses the admin login route", async () => {
    mocks.profileRole = "helper";
    const response = await POST(request());
    expect(response.headers.get("location")).toBe("http://localhost:3000/admin/login?error=invalid");
    const client = await mocks.createSupabaseServerClient.mock.results.at(-1)?.value;
    expect(client.auth.signOut).toHaveBeenCalledOnce();
    expect(mocks.recordSuccessfulLogin).not.toHaveBeenCalled();
  });

  it("renders the challenge handoff when the account reaches its hourly threshold", async () => {
    mocks.inspectLoginThrottle.mockResolvedValue({ locked: false, challengeRequired: true, retryAfterSeconds: 60 });
    mocks.verifyTurnstile.mockResolvedValue(false);
    const response = await POST(request());
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3000/admin/login?error=invalid&challenge=1");
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("blocks a locked pair with Retry-After before authenticating", async () => {
    mocks.inspectLoginThrottle.mockResolvedValue({ locked: true, challengeRequired: false, retryAfterSeconds: 180 });
    const response = await POST(request());
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3000/admin/login?error=try-again");
    expect(response.headers.get("retry-after")).toBe("180");
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
  });
});
