import "server-only";

import { ok, fail } from "@/server/services/result";
import type { Result } from "@/server/services/result";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export interface TrackEventInput {
  eventName: string;
  userId?: string | null;
  userRole?: string | null;
  sessionId?: string | null;
  metadata?: Record<string, unknown>;
}

// Allowed event names for Phase B metrics tracking
export const ALLOWED_EVENT_NAMES = [
  "landing_view",
  "booking_started",
  "booking_created",
  "checkout_initiated",
  "payment_completed",
  "helper_offer_viewed",
  "helper_offer_accepted",
  "helper_on_my_way",
  "helper_checked_in",
  "booking_completed",
  "booking_cancelled",
  "support_ticket_created",
  "kyc_submitted",
] as const;

export type AllowedEventName = (typeof ALLOWED_EVENT_NAMES)[number];

/**
 * Strips any potential sensitive keys (PII, credentials) from metadata before persisting.
 */
export function sanitizeAnalyticsMetadata(
  metadata: Record<string, unknown>,
): Record<string, unknown> {
  const sensitiveKeys = new Set([
    "password",
    "token",
    "secret",
    "idnumber",
    "id_number",
    "cardnumber",
    "card_number",
    "cvv",
    "phone",
    "address",
    "email",
  ]);

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!sensitiveKeys.has(key.toLowerCase())) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Record a cookieless product analytics event in PostgreSQL.
 */
export async function trackEvent(
  db: Db,
  input: TrackEventInput,
): Promise<Result<{ eventId: string }>> {
  if (!input.eventName || input.eventName.length > 100) {
    return fail("validation_failed", "Invalid event name");
  }

  const safeMetadata = sanitizeAnalyticsMetadata(input.metadata || {});

  const { data, error } = await db
    .from("analytics_events")
    .insert({
      event_name: input.eventName,
      user_id: input.userId ?? null,
      user_role: input.userRole ?? null,
      session_id: input.sessionId ?? null,
      metadata: safeMetadata,
    })
    .select("id")
    .single();

  if (error || !data) {
    return fail("internal_error", "Failed to track analytics event");
  }

  return ok({ eventId: data.id as string });
}

/**
 * Aggregate event counts since a given timestamp for pilot metrics reporting.
 */
export async function getEventCounts(
  db: Db,
  since: Date,
): Promise<Result<Record<string, number>>> {
  const { data, error } = await db
    .from("analytics_events")
    .select("event_name")
    .gte("created_at", since.toISOString());

  if (error) {
    return fail("internal_error", "Failed to retrieve event counts");
  }

  const counts: Record<string, number> = {};
  for (const row of (data || []) as Array<{ event_name: string }>) {
    counts[row.event_name] = (counts[row.event_name] || 0) + 1;
  }

  return ok(counts);
}
