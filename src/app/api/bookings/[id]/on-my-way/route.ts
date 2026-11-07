import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { limitRequest } from "@/server/security/request-rate-limit";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { sameOrigin } from "@/server/security/origin";
import { generateWhatsAppEtaLink } from "@/server/services/location-tracking";
import { trackEvent } from "@/server/services/analytics";
import { createNotification } from "@/server/services/notifications";

const onMyWaySchema = z.object({
  etaMinutes: z.coerce.number().int().min(5).max(180).default(30),
}).default({ etaMinutes: 30 });

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: bookingId } = await context.params;

  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("booking", request),
    botCheck: async () => true,
    validate: async () => {
      try {
        let body: Record<string, unknown> = {};
        if (request.headers.get("content-type")?.includes("application/json")) {
          body = await request.json().catch(() => ({}));
        } else {
          const form = await request.formData().catch(() => null);
          if (form) body = Object.fromEntries(form.entries());
        }
        const parsed = onMyWaySchema.safeParse(body);
        return { ok: true as const, data: parsed.success ? parsed.data : { etaMinutes: 30 } };
      } catch {
        return { ok: true as const, data: { etaMinutes: 30 } };
      }
    },
    authorize: async () => {
      if (!sameOrigin(request)) return { ok: false as const, error: "origin" };
      try {
        const actor = await requireActor();
        return { ok: true as const, data: actor };
      } catch {
        return { ok: false as const, error: "forbidden" };
      }
    },
    service: async (input, actor) => {
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

      const etaMinutes = input.etaMinutes ?? 30;
      const enRouteAt = new Date().toISOString();

      // Record first-party analytics event for host visibility and metrics
      try {
        await trackEvent(adminDb, {
          eventName: "helper_on_my_way",
          userId: actor.userId,
          userRole: "helper",
          metadata: {
            booking_id: bookingId,
            eta_minutes: etaMinutes,
            en_route_at: enRouteAt,
          },
        });
      } catch {
        // Analytics tracking shouldn't block user response
      }

      // Fetch host phone + first name for WhatsApp ETA message
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

      // Send in-app notification to host
      try {
        await createNotification({
          userId: booking.host_id,
          kind: "helper_on_my_way",
          title: `${helperProfile?.first_name ?? "Helper"} is on the way`,
          body: `ETA: approx ${etaMinutes} minutes.`,
          actionPath: `/app/requests/${bookingId}`,
          referenceId: bookingId,
        });
      } catch {
        // Notification tracking shouldn't block user response
      }

      let whatsappUrl: string | null = null;
      if (hostProfile?.phone && helperProfile?.first_name) {
        whatsappUrl = generateWhatsAppEtaLink({
          hostPhone: hostProfile.phone as string,
          helperFirstName: helperProfile.first_name as string,
          etaMinutes,
        });
      }

      return {
        ok: true as const,
        data: {
          success: true,
          etaMinutes,
          enRouteAt,
          whatsappUrl,
        },
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: bookingId } = await context.params;

  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("booking", request),
    botCheck: async () => true,
    validate: async () => ({ ok: true as const, data: { bookingId } }),
    authorize: async () => {
      if (!sameOrigin(request)) return { ok: false as const, error: "origin" };
      try {
        const actor = await requireActor();
        return { ok: true as const, data: actor };
      } catch {
        return { ok: false as const, error: "unauthenticated" };
      }
    },
    service: async (_input, actor) => {
      const adminDb = createSupabaseAdminClient();

      const { data: booking, error: bookingError } = await adminDb
        .from("phase_a_bookings")
        .select("id, status, host_id")
        .eq("id", bookingId)
        .maybeSingle();

      if (bookingError || !booking) {
        return { ok: false as const, error: { code: "not_found", message: "Booking not found" } };
      }

      if (actor.role === "host" && booking.host_id !== actor.userId) {
        return { ok: false as const, error: { code: "forbidden", message: "Forbidden" } };
      }

      let enRoute: { etaMinutes: number; enRouteAt: string } | null = null;
      try {
        const { data: eventData } = await adminDb
          .from("analytics_events")
          .select("created_at, metadata")
          .eq("event_name", "helper_on_my_way")
          .order("created_at", { ascending: false })
          .limit(10);

        const match = (eventData ?? []).find(
          (e: { metadata?: Record<string, unknown> }) =>
            e.metadata?.booking_id === bookingId || e.metadata?.bookingId === bookingId,
        );
        if (match && typeof match === "object") {
          const meta = (match as { metadata?: Record<string, unknown>; created_at: string }).metadata;
          enRoute = {
            etaMinutes: Number(meta?.eta_minutes ?? meta?.etaMinutes ?? 30),
            enRouteAt: (match as { created_at: string }).created_at,
          };
        }
      } catch {
        // Non-critical
      }

      return {
        ok: true as const,
        data: {
          bookingId,
          status: booking.status,
          enRoute,
        },
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
    const status = result.error.code === "not_found" ? 404 : result.error.code === "forbidden" ? 403 : 400;
    return NextResponse.json({ error: result.error.message }, { status });
  }

  return NextResponse.json(result.data, { status: 200 });
}
