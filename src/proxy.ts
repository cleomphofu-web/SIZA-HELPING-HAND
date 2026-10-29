import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isPrototypePath, prototypeRoutesEnabled } from "@/lib/prototype";
import { supabaseAuthCookieOptions } from "@/lib/supabase-cookie-options";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (isPrototypePath(pathname) && !prototypeRoutesEnabled()) return new NextResponse(null, { status: 404 });
  const sessionRoutes = ["/app", "/helper", "/admin"];
  const isPublicAdminLogin = pathname === "/admin/login";
  const isPageSessionRoute = request.method === "GET" && !isPublicAdminLogin && sessionRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (!isPageSessionRoute) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.SUPABASE_URL ?? "", process.env.SUPABASE_ANON_KEY ?? "", {
    cookieOptions: supabaseAuthCookieOptions(process.env.NODE_ENV === "production"),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getClaims();
  return response;
}

export const config = { matcher: ["/signup", "/login", "/app/:path*", "/helper/:path*", "/admin/:path*", "/api/:path*"] };
