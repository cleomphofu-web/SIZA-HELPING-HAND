import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/config/env", () => ({ env: { ID_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64") } }));

describe("ID encryption", () => {
  beforeEach(() => vi.resetModules());

  it("round-trips an ID number", async () => {
    const { decryptIdNumber, encryptIdNumber } = await import("@/server/security/crypto");
    expect(decryptIdNumber(encryptIdNumber("9001015009087"))).toBe("9001015009087");
  });

  it("uses a fresh nonce for the same input", async () => {
    const { encryptIdNumber } = await import("@/server/security/crypto");
    expect(encryptIdNumber("9001015009087")).not.toBe(encryptIdNumber("9001015009087"));
  });

  it("rejects tampered ciphertext", async () => {
    const { decryptIdNumber, encryptIdNumber } = await import("@/server/security/crypto");
    const payload = Buffer.from(encryptIdNumber("9001015009087"), "base64");
    payload[payload.length - 1] ^= 1;
    expect(() => decryptIdNumber(payload.toString("base64"))).toThrow();
  });
});
