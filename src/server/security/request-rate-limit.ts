import "server-only";

import type { RateLimitBucket } from "@/server/security/ratelimit";
import { createSupabaseServerClient } from "@/server/db/server";
import { limit } from "@/server/security/ratelimit";

type RateLimited = { allowed: boolean; retryAfterSeconds?: number };

function requestIp(request: Request) {
  return request.headers.get("x-real-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

export async function limitRequest(bucket: RateLimitBucket, request: Request): Promise<RateLimited> {
  let subject = requestIp(request);
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) subject = user.id;
  } catch {
    // Keep the request rate-limited by its network identity if auth lookup is unavailable.
  }
  return limit(bucket, subject);
}

export function retryAfterHeaders(result: { retryAfterSeconds?: number }) {
  const retryAfter = result.retryAfterSeconds;
  const seconds = typeof retryAfter === "number" && Number.isFinite(retryAfter) ? Math.max(1, Math.floor(retryAfter)) : 60;
  return { "Retry-After": String(seconds) };
}
