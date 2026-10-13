"use server";

import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getShortlist(bookingId: string) {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const { data: booking, error: bookingError } = await supabase.from("bookings").select("suburb, property_type").eq("id", bookingId).single();
  if (bookingError || !booking) throw new Error("Booking unavailable");
  const service = booking.property_type === "office" ? "office" : "home";
  const { data, error } = await supabase.from("cleaners").select("id, full_name, phone, suburbs, services, rate_amount, rate_unit").eq("status", "approved").contains("suburbs", [booking.suburb]).contains("services", [service]);
  if (error) throw new Error("Could not load shortlist");
  return data;
}

export async function assignCleaners(bookingId: string, cleanerIds: string[]) {
  await requireAdmin();
  if (cleanerIds.length < 1 || cleanerIds.length > 4) throw new Error("Select between one and four cleaners");
  const supabase = createSupabaseAdminClient();
  const { data: approved, error: cleanerError } = await supabase.from("cleaners").select("id").in("id", cleanerIds).eq("status", "approved");
  if (cleanerError || approved?.length !== cleanerIds.length) throw new Error("Only approved cleaners can be assigned");
  const { error } = await supabase.from("bookings").update({ assigned_cleaner_ids: cleanerIds, status: "assigned" }).eq("id", bookingId);
  if (error) throw new Error("Could not assign cleaners");
}

export async function setBookingStatus(bookingId: string, status: "new" | "assigned" | "completed" | "cancelled") {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId);
  if (error) throw new Error("Could not update booking");
}
