const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60;

export function supabaseAuthCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  };
}
