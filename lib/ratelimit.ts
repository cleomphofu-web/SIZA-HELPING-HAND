import { env } from "@/lib/env";

export type RateLimitBucket = "booking" | "apply" | "upload" | "login";
type LimitResult = { allowed: boolean; retryAfterSeconds: number };

const windows: Record<RateLimitBucket, { limit: number; seconds: number }> = {
  booking: { limit: 10, seconds: 60 * 60 },
  apply: { limit: 5, seconds: 60 * 60 },
  upload: { limit: 30, seconds: 60 * 60 },
  login: { limit: 5, seconds: 15 * 60 },
};

export async function limit(bucket: RateLimitBucket, ip: string): Promise<LimitResult> {
  if (!ip || !env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return { allowed: false, retryAfterSeconds: windows[bucket].seconds };
  const config = windows[bucket];
  const key = `siza:ratelimit:${bucket}:${ip}`;
  try {
    const response = await fetch(`${env.UPSTASH_REDIS_REST_URL}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, config.seconds, "NX"],
        ["TTL", key],
      ]),
      cache: "no-store",
    });
    if (!response.ok) return { allowed: false, retryAfterSeconds: config.seconds };
    const result = await response.json() as Array<{ result: number }>;
    const count = Number(result[0]?.result);
    const ttl = Math.max(1, Number(result[2]?.result) || config.seconds);
    return { allowed: Number.isFinite(count) && count <= config.limit, retryAfterSeconds: ttl };
  } catch {
    return { allowed: false, retryAfterSeconds: config.seconds };
  }
}
