import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/server/config/env";
import { supabaseAuthCookieOptions } from "@/lib/supabase-cookie-options";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookieOptions: supabaseAuthCookieOptions(process.env.NODE_ENV === "production"),
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Server Components cannot mutate cookies. */ }
      },
    },
  });
}
