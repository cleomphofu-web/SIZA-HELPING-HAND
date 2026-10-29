import { describe, expect, it } from "vitest";
import { supabaseAuthCookieOptions } from "@/lib/supabase-cookie-options";

describe("Supabase session cookie options", () => {
  it("uses HttpOnly, Secure, SameSite Lax and a one-hour lifetime in production", () => {
    expect(supabaseAuthCookieOptions(true)).toEqual({ httpOnly: true, secure: true, sameSite: "lax", maxAge: 3600, path: "/" });
  });

  it("keeps local HTTP development usable while retaining HttpOnly and a short lifetime", () => {
    expect(supabaseAuthCookieOptions(false)).toEqual({ httpOnly: true, secure: false, sameSite: "lax", maxAge: 3600, path: "/" });
  });
});
