import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { isPrototypePath, prototypeRoutesEnabled } from "@/lib/prototype";
import { proxy } from "@/proxy";

const { createServerClientMock } = vi.hoisted(() => ({ createServerClientMock: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: createServerClientMock }));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

beforeEach(() => createServerClientMock.mockReset());
afterEach(() => vi.unstubAllEnvs());

describe("prototype switch", () => {
  it("is off unless explicitly enabled", () => {
    expect(prototypeRoutesEnabled({})).toBe(false);
    expect(prototypeRoutesEnabled({ ALLOW_PROTOTYPE_ROUTES: "false" })).toBe(false);
    expect(prototypeRoutesEnabled({ ALLOW_PROTOTYPE_ROUTES: "true" })).toBe(true);
  });

  it("identifies every non-public prototype route family", () => {
    expect(isPrototypePath("/api/bookings")).toBe(true);
    expect(isPrototypePath("/app/requests")).toBe(true);
    expect(isPrototypePath("/helper/jobs")).toBe(true);
    expect(isPrototypePath("/admin")).toBe(true);
    expect(isPrototypePath("/signup")).toBe(false);
    expect(isPrototypePath("/login")).toBe(false);
    expect(isPrototypePath("/")).toBe(false);
  });

  it("makes the central proxy return 404 before an API route can run", async () => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "false");
    const response = await proxy(new NextRequest("https://siza.example/api/bookings", { method: "POST" }));
    expect(response.status).toBe(404);
    vi.unstubAllEnvs();
  });

  it("lets the signup hand-off resolve while keeping its mutation API gated", async () => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "false");
    const response = await proxy(new NextRequest("https://siza.example/signup?role=host"));
    const mutationResponse = await proxy(
      new NextRequest("https://siza.example/api/auth/signup", { method: "POST" }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(mutationResponse.status).toBe(404);
    vi.unstubAllEnvs();
  });

  it.each(["/app", "/helper/jobs", "/admin"]) (
    "refreshes the session for protected route %s and forwards rotated cookies both ways",
    async (pathname) => {
      vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "true");
      vi.stubEnv("NODE_ENV", "production");
      let setAll: ((cookies: Array<{ name: string; value: string; options: { path: string; httpOnly: boolean } }>) => void) | undefined;
      createServerClientMock.mockImplementation((_url, _key, options) => {
        setAll = options.cookies.setAll;
        return { auth: { getClaims: vi.fn(async () => {
          setAll?.([{ name: "sb-test-auth", value: "rotated", options: { path: "/", httpOnly: true } }]);
          return { data: { claims: { sub: "verified-user" } }, error: null };
        }) } };
      });
      const request = new NextRequest(`https://siza.example${pathname}`, { headers: { cookie: "sb-test-auth=old" } });

      const response = await proxy(request);

      expect(createServerClientMock).toHaveBeenCalledOnce();
      expect(createServerClientMock.mock.calls[0]?.[2]).toMatchObject({ cookieOptions: { httpOnly: true, secure: true, sameSite: "lax", maxAge: 3600, path: "/" } });
      expect(request.cookies.get("sb-test-auth")?.value).toBe("rotated");
      expect(response.cookies.get("sb-test-auth")?.value).toBe("rotated");
      vi.unstubAllEnvs();
      createServerClientMock.mockReset();
    },
  );

  it("does not refresh sessions for public account endpoints", async () => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "true");

    const response = await proxy(new NextRequest("https://siza.example/api/auth/signup", { method: "POST" }));

    expect(response.status).toBe(200);
    expect(createServerClientMock).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("keeps the public admin login page reachable without an authenticated session", async () => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "true");
    createServerClientMock.mockReturnValue({ auth: { getClaims: vi.fn(async () => ({ data: { claims: null }, error: null })) } });

    const response = await proxy(new NextRequest("https://siza.example/admin/login"));

    expect(response.status).toBe(200);
    expect(createServerClientMock).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("does not refresh a protected API session in Proxy before the route rate-limit step", async () => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "true");

    const response = await proxy(new NextRequest("https://siza.example/api/reports", { method: "POST" }));

    expect(response.status).toBe(200);
    expect(createServerClientMock).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("makes a direct server-action guard fail closed when the proxy is bypassed", async () => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "false");
    const { requirePrototypeRoutes } = await import("@/server/policies/prototype");
    expect(requirePrototypeRoutes).toThrow("NEXT_NOT_FOUND");
    vi.unstubAllEnvs();
  });
});
