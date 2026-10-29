import { describe, expect, it, vi } from "vitest";
import { sameOrigin, sameOriginHeaders } from "@/server/security/origin";

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
