export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin !== null && origin === new URL(request.url).origin;
}

export function sameOriginHeaders(headers: Pick<Headers, "get">): boolean {
  const origin = headers.get("origin") ?? (headers.get("referer") ? new URL(headers.get("referer")!).origin : null);
  const host = headers.get("host");
  if (!origin || !host) return false;
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    if (parsed.origin !== origin) return false;
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") return false;
    return parsed.host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Resolves the trusted canonical site origin for auth links (password resets, signup callbacks).
 * It uses the configured APP_BASE_URL (or NEXT_PUBLIC_SITE_URL).
 * When unconfigured in non-production environments, it permits localhost / 127.0.0.1 / test origins.
 * In production, it defaults strictly to https://siza.co.za to protect against Host header spoofing.
 */
export function resolveCanonicalSiteOrigin(request?: Request): string {
  const configured = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Ignore invalid URL formatting
    }
  }

  if (process.env.NODE_ENV === "production") {
    return "https://siza.co.za";
  }

  if (request) {
    try {
      const parsed = new URL(request.url);
      const host = parsed.hostname.toLowerCase();
      if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".test") || host.endsWith(".example")) {
        return parsed.origin;
      }
    } catch {
      // Ignore invalid request URL
    }
  }

  return "http://localhost:3000";
}

/**
 * Resolves a safe internal redirect destination from a user-supplied target or referer header.
 * Disallows external schemes, mismatched hosts, protocol-relative URLs (//evil.com),
 * and javascript: / data: schemes, redirecting only to internal paths on the current request host.
 */
export function resolveSafeInternalRedirect(
  target: string | null | undefined,
  defaultPath: string,
  requestUrl: string
): URL {
  const base = new URL(requestUrl);
  if (!target) {
    return new URL(defaultPath, base);
  }

  try {
    const parsed = new URL(target, base);
    if (parsed.origin === base.origin && parsed.pathname.startsWith("/")) {
      return parsed;
    }
  } catch {
    // Ignore invalid target URL
  }

  return new URL(defaultPath, base);
}
