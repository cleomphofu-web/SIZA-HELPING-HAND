import "server-only";

import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireAdmin } from "@/server/policies/auth";
import { fail, ok, type Result } from "@/server/services/result";

export type AdminOverview = {
  hosts: number;
  helpers: { pending: number; approved: number; declined: number; suspended: number };
  bookings: { open: number; assigned: number; inProgress: number; completed: number };
  reportsToReview: number;
};

/** Request-time aggregate snapshot. No profile, booking, report or auth details leave this boundary. */
export async function getAdminOverview(): Promise<Result<AdminOverview>> {
  await requireAdmin();

  try {
    const client = createSupabaseAdminClient();
    const counts = await Promise.all([
      client.from("profiles").select("id", { count: "exact", head: true }).eq("role", "host").is("deleted_at", null),
      client.from("helper_details").select("user_id", { count: "exact", head: true }).eq("status", "pending"),
      client.from("helper_details").select("user_id", { count: "exact", head: true }).eq("status", "approved"),
      client.from("helper_details").select("user_id", { count: "exact", head: true }).eq("status", "declined"),
      client.from("helper_details").select("user_id", { count: "exact", head: true }).eq("status", "suspended"),
      client.from("phase_a_bookings").select("id", { count: "exact", head: true }).eq("status", "open"),
      client.from("phase_a_bookings").select("id", { count: "exact", head: true }).eq("status", "assigned"),
      client.from("phase_a_bookings").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
      client.from("phase_a_bookings").select("id", { count: "exact", head: true }).eq("status", "completed"),
      client.from("phase_a_reports").select("id", { count: "exact", head: true }).eq("status", "open"),
      client.from("phase_a_reports").select("id", { count: "exact", head: true }).eq("status", "reviewing"),
    ]);

    if (counts.some((count) => count.error || count.count === null)) {
      return fail("internal_error", "The overview could not load. Try reloading the page.");
    }

    const values = counts.map((count) => count.count as number);
    return ok({
      hosts: values[0],
      helpers: { pending: values[1], approved: values[2], declined: values[3], suspended: values[4] },
      bookings: { open: values[5], assigned: values[6], inProgress: values[7], completed: values[8] },
      reportsToReview: values[9] + values[10],
    });
  } catch {
    return fail("internal_error", "The overview could not load. Try reloading the page.");
  }
}
