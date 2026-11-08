import { describe, expect, it, vi } from "vitest";
import { resolveCanonicalSiteOrigin, resolveSafeInternalRedirect, sameOrigin, sameOriginHeaders } from "@/server/security/origin";

describe("cookie route origin validation", () => {
  it("requires an explicit matching Origin header", () => {
    expect(sameOrigin(new Request("https://siza.example/api/admin/login", { method: "POST" }))).toBe(false);
  });

  it("rejects a foreign Origin header", () => {
    expect(sameOrigin(new Request("https://siza.example/api/admin/login", { method: "POST", headers: { origin: "https://attacker.example" } }))).toBe(false);
  });

  it("accepts the exact request origin", () => {
    expect(sameOrigin(new Request("https://siza.example/api/admin/login", { method: "POST", headers: { origin: "https://siza.example" } }))).toBe(true);
  });

  it("requires a matching Origin and actual Host for Server Actions", () => {
    expect(sameOriginHeaders(new Headers({ host: "siza.example" }))).toBe(false);
    expect(sameOriginHeaders(new Headers({ origin: "https://attacker.example", host: "siza.example" }))).toBe(false);
    expect(sameOriginHeaders(new Headers({ origin: "https://siza.example", host: "siza.example" }))).toBe(true);
    expect(sameOriginHeaders(new Headers({ origin: "https://siza.example", "x-forwarded-host": "siza.example" }))).toBe(false);
    expect(sameOriginHeaders(new Headers({ origin: "https://siza.example", host: "attacker.example", "x-forwarded-host": "siza.example" }))).toBe(false);
    expect(sameOriginHeaders(new Headers({ origin: "https://siza.example/path", host: "siza.example" }))).toBe(false);
  });

  it("requires HTTPS for production Server Action origins", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(sameOriginHeaders(new Headers({ origin: "http://siza.example", host: "siza.example" }))).toBe(false);
    expect(sameOriginHeaders(new Headers({ origin: "https://siza.example", host: "siza.example" }))).toBe(true);
    vi.unstubAllEnvs();
  });
});

describe("resolveCanonicalSiteOrigin", () => {
  it("uses configured APP_BASE_URL when present", () => {
    vi.stubEnv("APP_BASE_URL", "https://custom.siza.co.za");
    expect(resolveCanonicalSiteOrigin(new Request("https://attacker.example/api/auth/reset-password"))).toBe("https://custom.siza.co.za");
    vi.unstubAllEnvs();
  });

  it("supports VERCEL_URL automatically", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "siza-preview-abc.vercel.app");
    expect(resolveCanonicalSiteOrigin(new Request("https://siza-preview-abc.vercel.app/api/auth/reset-password"))).toBe("https://siza-preview-abc.vercel.app");
    vi.unstubAllEnvs();
  });

  it("supports vercel.app domains directly from request in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(resolveCanonicalSiteOrigin(new Request("https://siza-cleaners.vercel.app/api/auth/reset-password"))).toBe("https://siza-cleaners.vercel.app");
    vi.unstubAllEnvs();
  });

  it("refuses attacker Host headers in production and enforces https://siza.co.za", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(resolveCanonicalSiteOrigin(new Request("https://attacker.example/api/auth/reset-password"))).toBe("https://siza.co.za");
    vi.unstubAllEnvs();
  });

  it("permits local development origins for local testing", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("APP_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(resolveCanonicalSiteOrigin(new Request("http://localhost:3000/api/auth/reset-password"))).toBe("http://localhost:3000");
    vi.unstubAllEnvs();
  });
});

describe("resolveSafeInternalRedirect", () => {
  const requestUrl = "https://siza.co.za/api/helper/voucher";

  it("permits safe same-origin internal paths", () => {
    const result = resolveSafeInternalRedirect("/helper/jobs", "/helper", requestUrl);
    expect(result.toString()).toBe("https://siza.co.za/helper/jobs");
  });

  it("permits full same-origin URLs", () => {
    const result = resolveSafeInternalRedirect("https://siza.co.za/app/requests/123", "/app", requestUrl);
    expect(result.toString()).toBe("https://siza.co.za/app/requests/123");
  });

  it("blocks external open redirects and uses the default path", () => {
    const result = resolveSafeInternalRedirect("https://malicious-site.example/steal", "/helper", requestUrl);
    expect(result.toString()).toBe("https://siza.co.za/helper");
  });

  it("blocks protocol-relative URLs", () => {
    const result = resolveSafeInternalRedirect("//malicious-site.example/steal", "/helper", requestUrl);
    expect(result.toString()).toBe("https://siza.co.za/helper");
  });

  it("blocks javascript pseudo-protocols", () => {
    const result = resolveSafeInternalRedirect("javascript:alert(1)", "/helper", requestUrl);
    expect(result.toString()).toBe("https://siza.co.za/helper");
  });

  it("handles null or empty referers with the default path", () => {
    expect(resolveSafeInternalRedirect(null, "/helper", requestUrl).toString()).toBe("https://siza.co.za/helper");
    expect(resolveSafeInternalRedirect("", "/helper", requestUrl).toString()).toBe("https://siza.co.za/helper");
  });
});
