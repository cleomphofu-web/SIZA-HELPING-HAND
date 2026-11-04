import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { sameOrigin } from "@/server/security/origin";
import { generateWhatsAppEtaLink } from "@/server/services/location-tracking";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: bookingId } = await context.params;

  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("booking", request),
    botCheck: async () => true,
    validate: async () => ({ ok: true as const, data: null }),
    authorize: async () => {
      if (!sameOrigin(request)) return { ok: false as const, error: "origin" };
      try {
        const actor = await requireActor();
        return { ok: true as const, data: actor };
      } catch {
        return { ok: false as const, error: "forbidden" };
      }
    },
    service: async (_input, actor) => {
      if (actor.role !== "helper") {
        return { ok: false as const, error: { code: "forbidden", message: "Only helpers can mark themselves on the way" } };
      }

      const adminDb = createSupabaseAdminClient();

      // Verify helper is assigned to this booking
      const { data: assignment, error: assignmentError } = await adminDb
        .from("booking_assignments")
        .select("id, status")
        .eq("booking_id", bookingId)
        .eq("helper_id", actor.userId)
        .eq("status", "accepted")
        .maybeSingle();

      if (assignmentError || !assignment) {
        return { ok: false as const, error: { code: "forbidden", message: "You are not assigned to this booking" } };
      }

      // Fetch booking + host_id
      const { data: booking, error: bookingError } = await adminDb
        .from("phase_a_bookings")
        .select("id, status, starts_at, host_id")
        .eq("id", bookingId)
        .maybeSingle();

      if (bookingError || !booking) {
        return { ok: false as const, error: { code: "not_found", message: "Booking not found" } };
      }

      // Fetch host phone + first name for WhatsApp ETA
      const { data: hostProfile } = await adminDb
        .from("profiles")
        .select("first_name, phone")
        .eq("id", booking.host_id)
        .maybeSingle();

      // Fetch helper first name
      const { data: helperProfile } = await adminDb
        .from("profiles")
        .select("first_name")
        .eq("id", actor.userId)
        .maybeSingle();

      let whatsappUrl: string | null = null;
      if (hostProfile?.phone && helperProfile?.first_name) {
        whatsappUrl = generateWhatsAppEtaLink({
          hostPhone: hostProfile.phone as string,
          helperFirstName: helperProfile.first_name as string,
          etaMinutes: 20, // Default ETA; real GPS ETA is a Phase C enhancement
        });
      }

      return {
        ok: true as const,
        data: { whatsappUrl },
      };
    },
  });

  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    const forbidden = pipeline.stage === "authorization";
    return NextResponse.json(
      { error: forbidden ? "Unauthorized" : "Validation failed" },
      { status: forbidden ? 401 : 400 },
    );
  }

  const result = pipeline.data;
  if (!result.ok) {
    if (result.error.code === "forbidden") {
      return NextResponse.json({ error: result.error.message }, { status: 403 });
    }
    if (result.error.code === "not_found") {
      return NextResponse.json({ error: result.error.message }, { status: 404 });
    }
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json(result.data, { status: 200 });
}
