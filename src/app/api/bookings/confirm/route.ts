import { NextRequest, NextResponse } from "next/server";
import { confirmBookingSchema } from "@/lib/schemas";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { assertRole } from "@/server/policies/authorization";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { confirmPhaseABooking } from "@/server/services/phase-a";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { sameOrigin } from "@/server/security/origin";
import { createNotification } from "@/server/services/notifications";

export async function POST(request: NextRequest) {
  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("booking", request), botCheck: async () => true,
    validate: async () => {
      const payload = request.headers.get("content-type")?.includes("application/json") ? await request.json() : Object.fromEntries(await request.formData());
      const parsed = confirmBookingSchema.safeParse(payload);
      return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "invalid" };
    },
    authorize: async () => {
      if (!sameOrigin(request)) return { ok: false as const, error: "origin" };
      try { const actor = await requireActor(); if (actor.role !== "host" && actor.role !== "helper") return { ok: false as const, error: "forbidden" }; assertRole(actor, actor.role); return { ok: true as const, data: { ...actor, role: actor.role as "host" | "helper" } }; } catch { return { ok: false as const, error: "forbidden" }; }
    },
    service: async (input, actor) => {
      const adminDb = createSupabaseAdminClient();
      const result = await confirmPhaseABooking(adminDb, actor.userId, actor.role, input);
      if (result.ok) {
        try {
          if (actor.role === "helper") {
            // Helper confirmed -> notify host
            const { data: booking } = await adminDb
              .from("phase_a_bookings")
              .select("host_id")
              .eq("id", input.bookingId)
              .maybeSingle();
            if (booking?.host_id) {
              await createNotification({
                userId: booking.host_id,
                kind: "booking_completed",
                title: "Job marked complete",
                body: "Your helper has marked the job as completed. Please confirm to finalize.",
                actionPath: `/app/requests/${input.bookingId}`,
                referenceId: input.bookingId,
              });
            }
          } else if (actor.role === "host") {
            // Host confirmed -> notify assigned helpers
            const { data: assignments } = await adminDb
              .from("booking_assignments")
              .select("helper_id")
              .eq("booking_id", input.bookingId);
            for (const assignment of assignments ?? []) {
              if (assignment.helper_id) {
                await createNotification({
                  userId: assignment.helper_id,
                  kind: "booking_completed",
                  title: "Job completed",
                  body: "The host has confirmed your job completion. Thank you!",
                  actionPath: `/helper/jobs/${input.bookingId}`,
                  referenceId: input.bookingId,
                });
              }
            }
          }
        } catch {
          // Notification tracking shouldn't block response
        }
      }
      return { bookingId: input.bookingId, role: actor.role, result };
    },
  });
  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    const forbidden = pipeline.stage === "authorization";
    return NextResponse.json({ ok: false, error: { code: forbidden ? "forbidden" : "validation_failed", message: forbidden ? "Only a booking participant can confirm it." : "That booking reference is not valid." } }, { status: forbidden ? 403 : 400 });
  }
  const { result, bookingId, role } = pipeline.data;
  if (result.ok && !request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.redirect(new URL(role === "host" ? `/app/requests/${bookingId}` : `/helper/jobs/${bookingId}`, request.url), 303);
  }
  const status = result.ok ? 200
    : result.error.code === "not_found" ? 404
      : result.error.code === "forbidden" ? 403
        : result.error.code === "conflict" ? 409
          : 500;
  return NextResponse.json(result, { status });
}
