import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { Resend } from "resend";
import { t } from "@/content/t";
import type { CopyKey } from "@/content/copy.generated";
import { env } from "@/server/config/env";

const resend = new Resend(env.RESEND_API_KEY);

export const OutboxEventTypes = [
  "host-booking-requested",
  "host-booking-assigned",
  "host-no-helper",
  "helper-approved",
  "helper-declined",
  "helper-job-assigned",
  "helper-plan-reminder",
  "admin-new-request",
  "admin-new-application",
] as const;

export type OutboxEventType = typeof OutboxEventTypes[number];

export interface EnqueueOutboxInput {
  eventType: OutboxEventType;
  recipient: string;
  entityId: string;
  variables?: Record<string, string>;
}

export function generateOutboxKey(eventType: string, entityId: string): string {
  const digest = createHash("sha256").update(`${eventType}:${entityId}`).digest("hex");
  return `siza:${eventType}:${digest}`;
}

export async function enqueueEmail(
  client: SupabaseClient,
  input: EnqueueOutboxInput,
): Promise<{ enqueued: boolean; id?: string }> {
  const emailSchema = z.string().email().max(254);
  const parsedRecipient = emailSchema.safeParse(input.recipient);
  if (!parsedRecipient.success) {
    throw new Error("Invalid recipient email address");
  }

  const idempotencyKey = generateOutboxKey(input.eventType, input.entityId);

  const { data, error } = await client
    .from("phase_a_email_outbox")
    .insert({
      event_type: input.eventType,
      recipient: parsedRecipient.data,
      payload: input.variables ?? {},
      idempotency_key: idempotencyKey,
      status: "pending",
    })
    .select("id")
    .maybeSingle();

  if (error) {
    // 23505 is PostgreSQL unique_violation code
    if (error.code === "23505") {
      return { enqueued: false };
    }
    throw new Error(`Failed to enqueue outbox email: ${error.message}`);
  }

  return { enqueued: true, id: data?.id };
}

function resolveEmailCopy(eventType: OutboxEventType): { subjectKey: CopyKey; bodyKey: CopyKey } {
  switch (eventType) {
    case "host-booking-requested":
      return { subjectKey: "email.host.requested.subject", bodyKey: "email.host.requested.body" };
    case "host-booking-assigned":
      return { subjectKey: "email.host.assigned.subject", bodyKey: "email.host.assigned.body" };
    case "host-no-helper":
      return { subjectKey: "email.host.no_helper.subject", bodyKey: "email.host.no_helper.body" };
    case "helper-approved":
      return { subjectKey: "email.helper.approved.subject", bodyKey: "email.helper.approved.body" };
    case "helper-declined":
      return { subjectKey: "email.helper.declined.subject", bodyKey: "email.helper.declined.body" };
    case "helper-job-assigned":
      return { subjectKey: "email.helper.job_assigned.subject", bodyKey: "email.helper.job_assigned.body" };
    case "helper-plan-reminder":
      return { subjectKey: "email.helper.plan_reminder.subject", bodyKey: "email.helper.plan_reminder.body" };
    case "admin-new-request":
      return { subjectKey: "email.admin.new_request.subject", bodyKey: "email.admin.new_request.body" };
    case "admin-new-application":
      return { subjectKey: "email.admin.new_application.subject", bodyKey: "email.admin.new_application.body" };
    default:
      throw new Error(`Unknown event type for email resolution: ${eventType}`);
  }
}

export async function processOutboxBatch(
  client: SupabaseClient,
  limit = 20,
): Promise<{ processed: number; sent: number; failed: number }> {
  const { data: rows, error } = await client
    .from("phase_a_email_outbox")
    .select("id, event_type, recipient, payload, idempotency_key, attempts")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !rows) {
    throw new Error(`Failed to fetch pending outbox rows: ${error?.message}`);
  }

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const { subjectKey, bodyKey } = resolveEmailCopy(
        row.event_type as OutboxEventType,
      );

      const subject = t(subjectKey, row.payload || {});
      const text = t(bodyKey, row.payload || {});

      const { error: sendError } = await resend.emails.send(
        {
          from: env.RESEND_FROM_EMAIL,
          to: row.recipient,
          subject,
          text,
        },
        { idempotencyKey: row.idempotency_key },
      );

      if (sendError) {
        throw new Error(sendError.message || "Provider send error");
      }

      await client
        .from("phase_a_email_outbox")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          attempts: row.attempts + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      sent += 1;
    } catch (err: unknown) {
      failed += 1;
      const message = err instanceof Error ? err.message : "Unknown send error";
      const nextStatus = row.attempts + 1 >= 5 ? "failed" : "pending";

      await client
        .from("phase_a_email_outbox")
        .update({
          status: nextStatus,
          attempts: row.attempts + 1,
          last_error: message.slice(0, 500),
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
    }
  }

  return { processed: rows.length, sent, failed };
}
