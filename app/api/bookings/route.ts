import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { bookingSchema, normaliseSaPhone } from "@/lib/schemas";
import { limit } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/turnstile";
import { notifyAdminNewBooking } from "@/lib/email";

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const rate = await limit("booking", ip);
  if (!rate.allowed) return NextResponse.json({ ok: false, error: "Please try again later" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  try {
    const form = await request.formData();
    const turnstileToken = String(form.get("turnstileToken") ?? "");
    if (!(await verifyTurnstile(turnstileToken, ip))) return NextResponse.json({ ok: false, error: "We could not verify this request" }, { status: 400 });
    const parsed = bookingSchema.safeParse({
      fullName: form.get("fullName"), phone: form.get("phone"), email: form.get("email"), suburb: form.get("suburb"),
      address: form.get("address"), propertyType: form.get("propertyType"), cleanersNeeded: form.get("cleanersNeeded") ?? 1,
      startAt: form.get("startAt"), endAt: form.get("endAt") ?? form.get("startAt"), accessNotes: form.get("accessNotes") ?? "", notes: form.get("notes") ?? "",
      consent: form.get("consent") === "on", honeypot: form.get("honeypot") ?? "",
    });
    if (!parsed.success) return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    if (parsed.data.honeypot) return NextResponse.json({ ok: true });
    const supabase = createSupabaseAdminClient();
    const { data: booking, error } = await supabase.from("bookings").insert({
      client_name: parsed.data.fullName, client_phone: normaliseSaPhone(parsed.data.phone), client_email: parsed.data.email,
      suburb: parsed.data.suburb, address: parsed.data.address, property_type: parsed.data.propertyType,
      cleaners_needed: parsed.data.cleanersNeeded, start_at: parsed.data.startAt.toISOString(), end_at: parsed.data.endAt.toISOString(),
      access_notes: parsed.data.accessNotes, notes: parsed.data.notes,
    }).select("id").single();
    if (error || !booking) return NextResponse.json({ ok: false, error: "We could not save your request" }, { status: 500 });
    await notifyAdminNewBooking(booking.id);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "We could not process your request" }, { status: 500 });
  }
}
