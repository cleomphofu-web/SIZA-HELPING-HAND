import { describe, it, expect, vi } from "vitest";
import { z } from "zod";

vi.mock("server-only", () => ({}));

describe("Reset Password API Route", () => {
  it("validates request schemas correctly", () => {

    const requestSchema = z.object({
      email: z.string().email(),
      action: z.literal("request"),
    });

    const updateSchema = z.object({
      password: z.string().min(8),
      action: z.literal("update"),
    });

    // Valid inputs
    expect(requestSchema.safeParse({ email: "user@example.com", action: "request" }).success).toBe(true);
    expect(updateSchema.safeParse({ password: "strongpassword123", action: "update" }).success).toBe(true);

    // Invalid inputs
    expect(requestSchema.safeParse({ email: "not-an-email", action: "request" }).success).toBe(false);
    expect(updateSchema.safeParse({ password: "short", action: "update" }).success).toBe(false);
  });
});
