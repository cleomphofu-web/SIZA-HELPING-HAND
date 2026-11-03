import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  validateSouthAfricanId,
  hashIdNumber,
  submitHelperKyc,
} from "@/server/services/kyc";

describe("KYC Verification Service", () => {
  // Known valid SA ID example for testing (Luhn valid: 9001015800088)
  // 900101: 1990-01-01, 5800: male, 0: SA citizen, 8, checksum: 8
  const validId = "9001015800088";

  describe("validateSouthAfricanId", () => {
    it("accepts valid SA ID number", () => {
      const result = validateSouthAfricanId(validId);
      expect(result.valid).toBe(true);
    });

    it("rejects ID with incorrect length", () => {
      expect(validateSouthAfricanId("900101580008").valid).toBe(false);
      expect(validateSouthAfricanId("90010158000889").valid).toBe(false);
    });

    it("rejects ID containing letters or special characters", () => {
      expect(validateSouthAfricanId("900101580008A").valid).toBe(false);
      expect(validateSouthAfricanId("900101-5800-088").valid).toBe(false);
    });

    it("rejects ID with invalid month", () => {
      // Month 13
      const result = validateSouthAfricanId("9013015800088");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("month");
    });

    it("rejects ID with invalid day", () => {
      // Day 32
      const result = validateSouthAfricanId("9001325800088");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("day");
    });

    it("rejects ID with failed Luhn checksum", () => {
      // Change last digit from 8 to 7
      const result = validateSouthAfricanId("9001015800087");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("checksum");
    });
  });

  describe("hashIdNumber", () => {
    it("produces deterministic SHA256 hex string", () => {
      const hash1 = hashIdNumber(validId, "test-pepper");
      const hash2 = hashIdNumber(validId, "test-pepper");
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[0-9a-f]{64}$/);
    });

    it("produces different hashes with different peppers", () => {
      const hash1 = hashIdNumber(validId, "pepper-1");
      const hash2 = hashIdNumber(validId, "pepper-2");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("submitHelperKyc", () => {
    function makeKycMockDb(options: { existingDuplicate?: boolean }) {
      const insertedKyc: Array<Record<string, unknown>> = [];
      const updatedHelper: Array<Record<string, unknown>> = [];

      return {
        from: (table: string) => {
          if (table === "kyc_verifications") {
            return {
              select: () => ({
                eq: () => ({
                  neq: () => ({
                    maybeSingle: async () => ({
                      data: options.existingDuplicate
                        ? { id: "kyc-existing", helper_id: "other-helper" }
                        : null,
                    }),
                  }),
                }),
              }),
              insert: (data: Record<string, unknown>) => {
                insertedKyc.push(data);
                return {
                  select: () => ({
                    single: async () => ({
                      data: { id: "kyc-new-id", ...data },
                      error: null,
                    }),
                  }),
                };
              },
            };
          }
          if (table === "helper_details") {
            return {
              update: (data: Record<string, unknown>) => {
                updatedHelper.push(data);
                return {
                  eq: async () => ({ error: null }),
                };
              },
            };
          }
          throw new Error(`Unexpected table: ${table}`);
        },
        _insertedKyc: insertedKyc,
        _updatedHelper: updatedHelper,
      };
    }

    it("successfully submits KYC with valid SA ID and records POPIA consent", async () => {
      const db = makeKycMockDb({});
      const result = await submitHelperKyc(
        db,
        {
          helperId: "helper-123",
          idNumber: validId,
          consentText: "I consent to DHA biometric verification under POPIA",
          consentVersion: "v1.0",
        },
        "pepper-secret",
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.status).toBe("verified");
        expect(result.data.dhaMatch).toBe(true);
        expect(result.data.livenessPassed).toBe(true);
      }

      expect(db._insertedKyc).toHaveLength(1);
      expect(db._insertedKyc[0]?.consent_version).toBe("v1.0");
      expect(db._insertedKyc[0]?.consent_text).toContain("POPIA");
      expect(db._updatedHelper).toHaveLength(1);
    });

    it("rejects duplicate ID already used by another helper", async () => {
      const db = makeKycMockDb({ existingDuplicate: true });
      const result = await submitHelperKyc(
        db,
        {
          helperId: "helper-123",
          idNumber: validId,
          consentText: "POPIA consent",
          consentVersion: "v1.0",
        },
        "pepper-secret",
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("conflict");
        expect(result.error.message).toContain("already registered");
      }
    });

    it("rejects invalid ID number before DB queries", async () => {
      const db = makeKycMockDb({});
      const result = await submitHelperKyc(
        db,
        {
          helperId: "helper-123",
          idNumber: "12345",
          consentText: "POPIA consent",
          consentVersion: "v1.0",
        },
        "pepper-secret",
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("validation_failed");
      }
    });
  });
});
