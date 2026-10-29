import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createServerClient: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.createServerClient }));
vi.mock("next/headers", () => ({ cookies: async () => ({ getAll: () => [], set: vi.fn() }) }));
vi.mock("@/server/config/env", () => ({ env: { SUPABASE_URL: "https://supabase.example", SUPABASE_ANON_KEY: "public-test-key" } }));

import { createSupabaseServerClient } from "@/server/db/server";

describe("server Supabase cookie configuration", () => {
  beforeEach(() => {
    mocks.createServerClient.mockReset().mockReturnValue({});
  });

  it("passes secure short-lived HttpOnly options to the server client in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await createSupabaseServerClient();
    expect(mocks.createServerClient).toHaveBeenCalledWith("https://supabase.example", "public-test-key", expect.objectContaining({
      cookieOptions: { httpOnly: true, secure: true, sameSite: "lax", maxAge: 3600, path: "/" },
    }));
    vi.unstubAllEnvs();
  });
});
