export type ErrorCode = "validation_failed" | "unauthenticated" | "forbidden" | "not_found" | "conflict" | "rate_limited" | "locked" | "subscription_required" | "already_taken" | "internal_error";

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; fields?: Record<string, string> } };

export function ok<T>(data: T): Result<T> { return { ok: true, data }; }
export function fail<T>(code: ErrorCode, message: string, fields?: Record<string, string>): Result<T> {
  return { ok: false, error: { code, message, ...(fields ? { fields } : {}) } };
}
