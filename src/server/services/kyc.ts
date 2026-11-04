import "server-only";

import { createHmac } from "node:crypto";
import { ok, fail } from "@/server/services/result";
import type { Result } from "@/server/services/result";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export interface KycSubmissionInput {
  helperId: string;
  idNumber: string;
  selfieBase64?: string;
  consentText: string;
  consentVersion: string;
}

export interface KycVerificationResult {
  verificationId: string;
  status: "verified" | "failed" | "pending";
  dhaMatch: boolean;
  livenessPassed: boolean;
}

/**
 * Validates a South African 13-digit ID number using the Luhn algorithm.
 * Format: YYMMDD SSSS C A Z
 * - YYMMDD: Date of birth
 * - SSSS: Sequence (0000-4999 female, 5000-9999 male)
 * - C: SA citizenship (0: SA citizen, 1: permanent resident)
 * - A: Usually 8
 * - Z: Luhn checksum digit
 */
export function validateSouthAfricanId(idNumber: string): { valid: boolean; reason?: string } {
  const cleaned = idNumber.trim();
  if (!/^\d{13}$/.test(cleaned)) {
    return { valid: false, reason: "ID number must be exactly 13 digits" };
  }

  // Validate DOB components
  const _year = parseInt(cleaned.substring(0, 2), 10);
  const month = parseInt(cleaned.substring(2, 4), 10);
  const day = parseInt(cleaned.substring(4, 6), 10);

  if (month < 1 || month > 12) {
    return { valid: false, reason: "Invalid birth month in ID number" };
  }

  if (day < 1 || day > 31) {
    return { valid: false, reason: "Invalid birth day in ID number" };
  }

  // Luhn algorithm check
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let digit = parseInt(cleaned.charAt(i), 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  if (sum % 10 !== 0) {
    return { valid: false, reason: "ID number checksum validation failed" };
  }

  return { valid: true };
}

/**
 * Generate HMAC-SHA256 hash of the ID number for duplicate detection and POPIA retention.
 */
export function hashIdNumber(idNumber: string, secretPepper: string): string {
  return createHmac("sha256", secretPepper).update(idNumber.trim()).digest("hex");
}

/**
 * Submit helper KYC for biometric & DHA verification.
 * Uses mock adapter if SMILE_ID credentials are not configured.
 */
export async function submitHelperKyc(
  db: Db,
  input: KycSubmissionInput,
  secretPepper: string,
): Promise<Result<KycVerificationResult>> {
  // 1. Validate SA ID format
  const idValidation = validateSouthAfricanId(input.idNumber);
  if (!idValidation.valid) {
    return fail("validation_failed", idValidation.reason || "Invalid ID number");
  }

  // 2. Generate HMAC hash
  const idHash = hashIdNumber(input.idNumber, secretPepper);

  // 3. Check for duplicate ID across helpers
  const { data: existingKyc } = await db
    .from("kyc_verifications")
    .select("id, helper_id")
    .eq("id_hash", idHash)
    .neq("helper_id", input.helperId)
    .maybeSingle();

  if (existingKyc) {
    return fail("conflict", "This identity document is already registered to another account");
  }

  // 4. Verify via Smile ID or Mock
  const isSmileIdConfigured = Boolean(
    process.env.SMILE_ID_PARTNER_ID &&
    process.env.SMILE_ID_API_KEY &&
    process.env.SMILE_ID_SID_SERVER,
  );

  let vendor: "smile_id" | "mock" = "mock";
  let dhaMatch = true;
  let livenessPassed = true;
  let livenessScore = 0.985;
  let status: "verified" | "failed" | "pending" = "verified";

  if (isSmileIdConfigured) {
    vendor = "smile_id";
    // TODO: Call Smile ID Web API when credentials provided by owner
    // For now, if keys are set but no network call is wired, mark pending for review
    status = "pending";
  } else {
    // Mock verification: succeeds for valid SA IDs
    vendor = "mock";
    dhaMatch = true;
    livenessPassed = true;
    livenessScore = 0.99;
    status = "verified";
  }

  // 5. Store KYC verification record with POPIA consent
  const { data: kycRecord, error: kycError } = await db
    .from("kyc_verifications")
    .insert({
      helper_id: input.helperId,
      vendor,
      vendor_ref: `kyc_${vendor}_${Date.now()}`,
      id_hash: idHash,
      dha_match: dhaMatch,
      liveness_score: livenessScore,
      liveness_passed: livenessPassed,
      status,
      consent_text: input.consentText,
      consent_version: input.consentVersion,
      consent_accepted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (kycError || !kycRecord) {
    return fail("internal_error", "Failed to record KYC verification");
  }

  // 6. If verified, update helper_details
  if (status === "verified") {
    await db
      .from("helper_details")
      .update({
        id_hash: idHash,
        vetted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", input.helperId);
  }

  return ok({
    verificationId: kycRecord.id,
    status,
    dhaMatch,
    livenessPassed,
  });
}
