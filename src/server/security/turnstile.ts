import { env } from "@/server/config/env";

type TurnstileResponse = { success: boolean };

export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  // When Turnstile is not configured, allow the request through.
  // TODO(owner): add TURNSTILE_SECRET_KEY and NEXT_PUBLIC_TURNSTILE_SITE_KEY env vars
  // to Vercel to enable bot protection on forms.
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;
  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body, cache: "no-store" });
    if (!response.ok) return false;
    const result = await response.json() as TurnstileResponse;
    return result.success === true;
  } catch {
    return false;
  }
}
