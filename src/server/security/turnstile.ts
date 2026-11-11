import { env } from "@/server/config/env";

type TurnstileResponse = { success: boolean };

// Cloudflare's official "always pass" test secret keys.
// When either a test key or no key at all is set, Turnstile is considered
// unconfigured and all requests are allowed through.
// TODO(owner): add real TURNSTILE_SECRET_KEY + NEXT_PUBLIC_TURNSTILE_SITE_KEY
// env vars in Vercel to enable bot protection.
const TURNSTILE_TEST_SECRETS = new Set([
  "1x0000000000000000000000000000000AA", // always passes
  "2x0000000000000000000000000000000AA", // always fails (also treated as unconfigured)
  "3x0000000000000000000000000000000AA", // always produces a token-already-spent error
]);

function isTurnstileConfigured(secret: string | undefined): secret is string {
  return Boolean(secret) && !TURNSTILE_TEST_SECRETS.has(secret!);
}

export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  if (!isTurnstileConfigured(env.TURNSTILE_SECRET_KEY)) return true;
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
