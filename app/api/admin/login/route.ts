import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { limit } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rate = await limit("login", ip);
  if (!rate.allowed) return NextResponse.redirect(new URL("/admin/login?error=try-again", request.url), 303);
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  if (!email || !password) return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url), 303);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url), 303);
  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
