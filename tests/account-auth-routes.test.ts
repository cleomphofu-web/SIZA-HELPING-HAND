import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createAccount: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  limit: vi.fn(),
  inspectLoginThrottle: vi.fn(),
  recordFailedLogin: vi.fn(),
  recordSuccessfulLogin: vi.fn(),
  sameOrigin: vi.fn(),
  verifyTurnstile: vi.fn(),
}));

vi.mock("@/server/services/accounts", () => ({ createAccount: mocks.createAccount }));
vi.mock("@/server/db/server", () => ({ createSupabaseServerClient: mocks.createSupabaseServerClient }));
vi.mock("@/server/security/ratelimit", () => ({ limit: mocks.limit }));
vi.mock("@/server/security/request-rate-limit", () => ({ limitRequest: mocks.limit, retryAfterHeaders: vi.fn((result: { retryAfterSeconds?: number }) => ({ "Retry-After": String(result.retryAfterSeconds ?? 60) })) }));
vi.mock("@/server/security/login-limiter", () => ({ inspectLoginThrottle: mocks.inspectLoginThrottle, recordFailedLogin: mocks.recordFailedLogin, recordSuccessfulLogin: mocks.recordSuccessfulLogin }));
vi.mock("@/server/security/origin", () => ({ sameOrigin: mocks.sameOrigin }));
vi.mock("@/server/security/turnstile", () => ({ verifyTurnstile: mocks.verifyTurnstile }));
vi.mock("server-only", () => ({}));

import { POST as signup } from "@/app/api/auth/signup/route";
import { POST as login } from "@/app/api/auth/login/route";

function request(path: string, fields: Record<string, string>) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  return new NextRequest(`http://localhost:3000${path}`, {
    method: "POST",
    headers: { origin: "http://localhost:3000" },
    body,
  });
}

function signupRequest() {
  return request("/api/auth/signup", {
    email: "person@example.test",
    password: "safe-password-123",
    role: "host",
    firstName: "Test",
    lastName: "Person",
    phone: "082 123 4567",
    termsVersion: "v1",
    privacyVersion: "v1",
    termsAccepted: "on",
    privacyAccepted: "on",
    honeypot: "",
    turnstileToken: "valid-token",
  });
}

function loginRequest() {
  return request("/api/auth/login", {
    email: "person@example.test",
    password: "safe-password-123",
    turnstileToken: "valid-token",
  });
}

describe("account authentication routes", () => {
  beforeEach(() => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "true");
    mocks.createAccount.mockReset();
    mocks.createSupabaseServerClient.mockReset();
    mocks.limit.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 60 });
    mocks.inspectLoginThrottle.mockReset().mockResolvedValue({ locked: false, challengeRequired: false, retryAfterSeconds: 60 });
    mocks.recordFailedLogin.mockReset().mockResolvedValue(true);
    mocks.recordSuccessfulLogin.mockReset().mockResolvedValue(true);
    mocks.sameOrigin.mockReset().mockReturnValue(true);
    mocks.verifyTurnstile.mockReset().mockResolvedValue(true);
  });

  it("returns the same generic signup acknowledgement for account conflict and success", async () => {
    mocks.createAccount.mockResolvedValueOnce({ ok: true, data: { userId: "new-user" } });
    const successResponse = await signup(signupRequest());
    const successBody = await successResponse.json();
    mocks.createAccount.mockResolvedValueOnce({ ok: false, error: { code: "conflict", message: "duplicate" } });
    const conflictResponse = await signup(signupRequest());
    const conflictBody = await conflictResponse.json();

    expect(successResponse.status).toBe(202);
    expect(conflictResponse.status).toBe(202);
    expect(successBody).toEqual(conflictBody);
    expect(JSON.stringify(successBody)).not.toContain("new-user");
  });

  it.each([
    ["host", "/app"],
    ["helper", "/helper"],
  ])("routes a verified %s to its own screen", async (role, destination) => {
    const supabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "actor-1" } } }),
        signOut: vi.fn(),
      },
      from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { role } }) })) })) })),
    };
    mocks.createSupabaseServerClient.mockResolvedValue(supabase);

    const response = await login(loginRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, data: { destination } });
    expect(mocks.verifyTurnstile).not.toHaveBeenCalled();
    expect(mocks.recordSuccessfulLogin).toHaveBeenCalledWith("person@example.test", "unknown");
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });

  it("signs an admin out of public login and gives the generic authentication failure", async () => {
    const supabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } } }),
        signOut: vi.fn(),
      },
      from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { role: "admin" } }) })) })) })),
    };
    mocks.createSupabaseServerClient.mockResolvedValue(supabase);

    const response = await login(loginRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ ok: false, error: { code: "unauthenticated", message: "We could not sign you in with those details." } });
    expect(supabase.auth.signOut).toHaveBeenCalledOnce();
  });

  it("uses the same login failure for invalid credentials and an unusable profile role", async () => {
    const invalidCredentials = {
      auth: { signInWithPassword: vi.fn().mockResolvedValue({ error: { message: "invalid" } }) },
    };
    mocks.createSupabaseServerClient.mockResolvedValueOnce(invalidCredentials);
    const invalidResponse = await login(loginRequest());
    const unusableRole = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "actor-2" } } }),
        signOut: vi.fn(),
      },
      from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) })) })) })),
    };
    mocks.createSupabaseServerClient.mockResolvedValueOnce(unusableRole);
    const roleResponse = await login(loginRequest());

    expect(roleResponse.status).toBe(invalidResponse.status);
    expect(await roleResponse.json()).toEqual(await invalidResponse.json());
    expect(mocks.recordFailedLogin).toHaveBeenCalledWith("person@example.test", "unknown");
    expect(unusableRole.auth.signOut).toHaveBeenCalledOnce();
  });

  it("records failed credentials but keeps the response generic", async () => {
    mocks.createSupabaseServerClient.mockResolvedValue({ auth: { signInWithPassword: vi.fn().mockResolvedValue({ error: { message: "private auth detail" } }) } });
    const response = await login(loginRequest());
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ ok: false, error: { code: "unauthenticated", message: "We could not sign you in with those details." } });
    expect(mocks.recordFailedLogin).toHaveBeenCalledWith("person@example.test", "unknown");
    expect(JSON.stringify(body)).not.toContain("private auth detail");
  });

  it("requires Turnstile only after the account failure threshold", async () => {
    mocks.inspectLoginThrottle.mockResolvedValue({ locked: false, challengeRequired: true, retryAfterSeconds: 60 });
    mocks.verifyTurnstile.mockResolvedValue(false);
    const response = await login(loginRequest());
    expect(response.status).toBe(428);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "challenge_required" } });
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("blocks a locked account/IP pair before Turnstile or authentication", async () => {
    mocks.inspectLoginThrottle.mockResolvedValue({ locked: true, challengeRequired: false, retryAfterSeconds: 240 });
    const response = await login(loginRequest());
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("240");
    expect(mocks.verifyTurnstile).not.toHaveBeenCalled();
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
  });

});
