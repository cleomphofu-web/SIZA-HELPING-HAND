export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin !== null && origin === new URL(request.url).origin;
}

export function sameOriginHeaders(headers: Pick<Headers, "get">): boolean {
  const origin = headers.get("origin");
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
