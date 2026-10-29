/** Shared fail-closed prototype decision; safe for the proxy and server code. */
export function prototypeRoutesEnabled(environment: Record<string, string | undefined> = process.env) {
  return environment.ALLOW_PROTOTYPE_ROUTES === "true";
}

export function isPrototypePath(pathname: string) {
  return ["/app", "/helper", "/admin", "/api"].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
