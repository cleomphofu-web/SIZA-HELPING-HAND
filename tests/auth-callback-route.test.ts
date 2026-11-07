import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
  limit: vi.fn(),
  cookies: vi.fn(),
}));

vi.mock("@/server/db/server", () => ({ createSupabaseServerClient: mocks.createSupabaseServerClient }));
vi.mock("@/server/db/admin", () => ({ createSupabaseAdminClient: mocks.createSupabaseAdminClient }));
vi.mock("@/server/security/request-rate-limit", () => ({
  limitRequest: mocks.limit,
  retryAfterHeaders: vi.fn(() => ({ "Retry-After": "60" })),
}));
vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));
vi.mock("server-only", () => ({}));

import { GET as callbackRoute } from "@/app/api/auth/callback/route";

describe("auth callback route", () => {
  beforeEach(() => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "true");
    mocks.limit.mockReset().mockResolvedValue({ allowed: true });
    mocks.cookies.mockReset().mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    });
    mocks.createSupabaseServerClient.mockReset();
    mocks.createSupabaseAdminClient.mockReset();
  });

  it("handles token_hash verification for email confirmation", async () => {
    const supabase = {
      auth: {
        verifyOtp: vi.fn().mockResolvedValue({ data: { user: { id: "helper-1" } }, error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "helper-1" } } }),
      },
    };
    const adminClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: { role: "helper" } }),
          })),
        })),
      })),
    };
    mocks.createSupabaseServerClient.mockResolvedValue(supabase);
    mocks.createSupabaseAdminClient.mockReturnValue(adminClient);

    const req = new NextRequest("http://localhost:3000/api/auth/callback?token_hash=valid_hash&type=signup&role=helper");
    const response = await callbackRoute(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/helper");
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      token_hash: "valid_hash",
      type: "signup",
    });
  });

  it("handles PKCE code exchange", async () => {
    const supabase = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ data: {}, error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "host-1" } } }),
      },
    };
    const adminClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: { role: "host" } }),
          })),
        })),
      })),
    };
    mocks.createSupabaseServerClient.mockResolvedValue(supabase);
    mocks.createSupabaseAdminClient.mockReturnValue(adminClient);

    const req = new NextRequest("http://localhost:3000/api/auth/callback?code=pkce_code");
    const response = await callbackRoute(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/app");
    expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith("pkce_code");
  });

  it("redirects with error parameter when incoming request has error", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/callback?error=access_denied&error_description=Email+link+is+invalid+or+has+expired");
    const response = await callbackRoute(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login?error=Email%20link%20is%20invalid%20or%20has%20expired");
  });

  it("redirects to login with auth_verify_failed if verifyOtp returns error", async () => {
    const supabase = {
      auth: {
        verifyOtp: vi.fn().mockResolvedValue({ data: null, error: { message: "token expired" } }),
      },
    };
    mocks.createSupabaseServerClient.mockResolvedValue(supabase);

    const req = new NextRequest("http://localhost:3000/api/auth/callback?token_hash=bad_hash&type=email");
    const response = await callbackRoute(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?error=auth_verify_failed");
  });

  it("redirects to login with missing_code if neither code nor token_hash is present", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/callback");
    const response = await callbackRoute(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?error=missing_code");
  });
});
