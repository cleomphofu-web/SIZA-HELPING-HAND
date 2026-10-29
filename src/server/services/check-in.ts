import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export type CheckInState = { attempts: number; lockedUntil: Date | null; expiresAt: Date };
export type CheckInAttempt = CheckInState & { accepted: boolean };

export function generateCheckInCode(nextRandom: () => number = () => randomInt(0, 1_000_000)): string {
  return String(nextRandom()).padStart(6, "0").slice(-6);
}

export function hashCheckInCode(code: string, pepper: string): string {
  return createHmac("sha256", pepper).update(code, "utf8").digest("base64url");
}

export function verifyCheckInCode(code: string, hash: string, pepper: string): boolean {
  const actual = Buffer.from(hashCheckInCode(code, pepper));
  const expected = Buffer.from(hash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function nextCheckInAttempt(state: CheckInState, now: Date, matches: boolean, maxAttempts: number, lockMinutes: number): CheckInAttempt {
  if (state.expiresAt <= now || (state.lockedUntil !== null && state.lockedUntil > now)) return { ...state, accepted: false };
  if (matches) return { attempts: 0, lockedUntil: null, expiresAt: state.expiresAt, accepted: true };
  const attempts = (state.lockedUntil !== null ? 0 : state.attempts) + 1;
  const lockedUntil = attempts >= maxAttempts ? new Date(now.getTime() + lockMinutes * 60_000) : null;
  return { attempts, lockedUntil, expiresAt: state.expiresAt, accepted: false };
}
