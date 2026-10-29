import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/server/config/env";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { rateLimitResponse } from "@/server/http/pipeline-responses";
import { runRequestPipeline } from "@/server/policies/request-pipeline";
import { limitRequest } from "@/server/security/request-rate-limit";
import {
  pruneExpiredRateLimitCounters,
  purgeExpiredHelperDocuments,
  expireOpenBookings,
  lapseExpiredSubscriptions,
  pruneExpiredBookingOffers,
  autoReleaseBookings,
  processPendingEmails,
} from "@/server/services/retention";

function matchesConfiguredSecret(authorization: string | null, configuredSecret: string | undefined) {
  if (!configuredSecret || configuredSecret.length < 32 || !authorization?.startsWith("Bearer ")) return false;
  const candidate = authorization.slice("Bearer ".length);
  if (!candidate || candidate.includes(" ")) return false;

  // Hash both values to fixed-size buffers before the timing-safe comparison.
  const configuredDigest = createHash("sha256").update(configuredSecret).digest();
  const candidateDigest = createHash("sha256").update(candidate).digest();
  return timingSafeEqual(configuredDigest, candidateDigest);
}

export async function POST(request: NextRequest) {
  const pipeline = await runRequestPipeline({
    rateLimit: () => limitRequest("admin_action", request),
    botCheck: async () => true,
    validate: async () => {
      const contentLength = request.headers.get("content-length");
      const bodyPresent = request.body !== null || (contentLength !== null && contentLength.trim() !== "0");
      if (request.nextUrl.search || bodyPresent) {
        return { ok: false as const, error: "unexpected_input" };
      }
      return { ok: true as const, data: undefined };
    },
    authorize: async () => matchesConfiguredSecret(request.headers.get("authorization"), env.MAINTENANCE_JOB_SECRET)
      ? { ok: true as const, data: undefined }
      : { ok: false as const, error: "forbidden" },
    service: async () => {
      try {
        const client = createSupabaseAdminClient();
        const now = new Date();

        const [
          documents,
          rateLimitCountersPruned,
          bookingsExpired,
          subscriptionsLapsed,
          offersPruned,
          bookingsAutoReleased,
          emailsProcessed,
        ] = await Promise.all([
          purgeExpiredHelperDocuments(client, now),
          pruneExpiredRateLimitCounters(client),
          expireOpenBookings(client, now),
          lapseExpiredSubscriptions(client, now),
          pruneExpiredBookingOffers(client, now),
          autoReleaseBookings(client, now),
          processPendingEmails(client),
        ]);

        return {
          ok: true as const,
          data: {
            ...documents,
            rateLimitCountersPruned,
            bookingsExpired,
            subscriptionsLapsed,
            offersPruned,
            bookingsAutoReleased,
            emailsProcessed,
          },
        };
      } catch {
        return { ok: false as const, error: { code: "internal_error", message: "The maintenance job could not be completed." } };
      }
    },
  });

  if (!pipeline.ok) {
    if (pipeline.stage === "rate_limit") return rateLimitResponse(pipeline);
    if (pipeline.stage === "authorization") return NextResponse.json({ ok: false, error: { code: "forbidden", message: "This request was not accepted." } }, { status: 403 });
    return NextResponse.json({ ok: false, error: { code: "validation_failed", message: "This request was not accepted." } }, { status: 400 });
  }

  return NextResponse.json(pipeline.data, { status: pipeline.data.ok ? 200 : 500 });
}
