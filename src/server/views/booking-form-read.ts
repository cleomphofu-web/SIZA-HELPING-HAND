import "server-only";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { fail, ok, type Result } from "@/server/services/result";
import { buildHostBookingFormView } from "@/server/views/booking-form";
import type { HostBookingFormView } from "@/server/views/booking-form";

export async function getOwnHostBookingFormView(): Promise<Result<HostBookingFormView>> {
  let actor;
  try { actor = await requireActor(); } catch { return fail("unauthenticated", "Sign in to request a helper."); }
  if (actor.role !== "host") return fail("forbidden", "Only hosts can request a helper.");

  const client = createSupabaseAdminClient();
  const [{ data: categories, error: categoryError }, { data: rates, error: rateError }, { data: zones, error: zoneError }, { data: approvedHelpers, error: helperError }, { data: floor, error: floorError }, { data: matchingGate, error: matchingGateError }] = await Promise.all([
    client.from("service_categories").select("name, enabled, pricing"),
    client.from("rate_card").select("service, hourly_cents, per_bedroom_minutes, per_bathroom_minutes, size_band_minutes, addon_minutes"),
    client.from("transport_zones").select("suburb, transport_cents, enabled"),
    client.from("helper_details").select("status, suburbs, services, first_job_completed_at, subscription_status, subscription_paid_until, profiles!inner(role)").eq("status", "approved"),
    client.from("app_config").select("value").eq("key", "floor_percent").maybeSingle(),
    client.from("app_config").select("value").eq("key", "helper_gender_matching_enabled").maybeSingle(),
  ]);
  if (categoryError || rateError || zoneError || helperError || floorError || matchingGateError) return fail("internal_error", "We could not load request options. Try again in a minute.");
  const floorPercent = Number(floor?.value);

  return ok(buildHostBookingFormView({
    categories: categories ?? [],
    rates: rates ?? [],
    zones: zones ?? [],
    approvedHelpers: (approvedHelpers ?? []).map((helper) => {
      const profile = Array.isArray(helper.profiles) ? helper.profiles[0] : helper.profiles;
      return { ...helper, role: profile?.role ?? "" };
    }),
    floorPercent: Number.isInteger(floorPercent) && floorPercent >= 0 && floorPercent <= 100 ? floorPercent : null,
    genderMatchingEnabled: matchingGate?.value === true,
  }));
}
