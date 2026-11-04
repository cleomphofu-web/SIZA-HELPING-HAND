import "server-only";

import { ok, fail } from "@/server/services/result";
import type { Result } from "@/server/services/result";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export interface LocationPingInput {
  bookingId: string;
  helperId: string;
  lat: number;
  lng: number;
  accuracyM?: number;
}

export interface LatestLocationResult {
  lat: number;
  lng: number;
  accuracyM: number | null;
  recordedAt: string;
}

/**
 * Record a live GPS location ping from an assigned helper for an active booking.
 * Enforces GPS coordinate bounds: lat [-90, 90], lng [-180, 180].
 */
export async function recordLocationPing(
  db: Db,
  input: LocationPingInput,
): Promise<Result<{ pingId: string }>> {
  if (input.lat < -90 || input.lat > 90) {
    return fail("validation_failed", "Latitude must be between -90 and 90 degrees");
  }

  if (input.lng < -180 || input.lng > 180) {
    return fail("validation_failed", "Longitude must be between -180 and 180 degrees");
  }

  // Verify helper is assigned to this booking
  const { data: assignment, error: assignmentError } = await db
    .from("booking_assignments")
    .select("id, status")
    .eq("booking_id", input.bookingId)
    .eq("helper_id", input.helperId)
    .maybeSingle();

  if (assignmentError || !assignment) {
    return fail("forbidden", "Helper is not assigned to this booking");
  }

  const { data: ping, error: pingError } = await db
    .from("location_pings")
    .insert({
      booking_id: input.bookingId,
      helper_id: input.helperId,
      lat: input.lat,
      lng: input.lng,
      accuracy_m: input.accuracyM ?? null,
    })
    .select("id")
    .single();

  if (pingError || !ping) {
    return fail("internal_error", "Failed to record location ping");
  }

  return ok({ pingId: ping.id as string });
}

/**
 * Retrieve the latest location ping for a booking.
 */
export async function getLatestLocation(
  db: Db,
  bookingId: string,
): Promise<Result<LatestLocationResult | null>> {
  const { data, error } = await db
    .from("location_pings")
    .select("lat, lng, accuracy_m, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return fail("internal_error", "Failed to read location");
  }

  if (!data) {
    return ok(null);
  }

  return ok({
    lat: Number(data.lat),
    lng: Number(data.lng),
    accuracyM: data.accuracy_m ? Number(data.accuracy_m) : null,
    recordedAt: data.created_at as string,
  });
}

/**
 * Generate a WhatsApp ETA notification link (wa.me) for host communication.
 * Helper taps "I'm on my way" and can send ETA directly via WhatsApp.
 */
export function generateWhatsAppEtaLink(input: {
  hostPhone: string;
  helperFirstName: string;
  etaMinutes: number;
}): string {
  // Clean phone number to digits only (e.g. +27... -> 27..., 082... -> 2782...)
  let phoneDigits = input.hostPhone.replace(/\D/g, "");
  if (phoneDigits.startsWith("0") && phoneDigits.length === 10) {
    phoneDigits = `27${phoneDigits.slice(1)}`;
  }
  const message = `Hi! I am on my way to your booking. My estimated arrival is in ${input.etaMinutes} minutes. - ${input.helperFirstName} (via siZa)`;
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}
