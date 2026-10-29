import { NextResponse } from "next/server";
import { retryAfterHeaders } from "@/server/security/request-rate-limit";

export function rateLimitResponse(result: { retryAfterSeconds?: number }) {
  return NextResponse.json(
    { ok: false, error: { code: "rate_limited", message: "Please try again later." } },
    { status: 429, headers: retryAfterHeaders(result) },
  );
}
