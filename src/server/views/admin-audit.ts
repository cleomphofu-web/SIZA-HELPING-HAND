import "server-only";

import { z } from "zod";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireAdmin } from "@/server/policies/auth";
import { fail, ok, type Result } from "@/server/services/result";

const PAGE_SIZE = 50;
const cursorSchema = z.object({ at: z.string().datetime({ offset: true }), id: z.string().uuid() }).strict();

export type AdminAuditEvent = { id: string; action: string; entity: string; at: string };
export type AdminAuditCursor = { at: string; id: string };
export type AdminAuditPageData = { events: AdminAuditEvent[]; hasMore: boolean; nextCursor: AdminAuditCursor | null };

/** Read-only admin audit view. Sensitive actor and entity identifiers never leave this boundary. */
export async function getAdminAuditEvents(input?: unknown): Promise<Result<AdminAuditPageData>> {
  await requireAdmin();

  const cursor = input === undefined ? undefined : cursorSchema.safeParse(input);
  if (cursor && !cursor.success) return fail("validation_failed", "The audit page cursor is invalid.");

  const client = createSupabaseAdminClient();
  let query = client.from("phase_a_audit_log")
    .select("id, action, entity, at")
    .order("at", { ascending: false })
    .order("id", { ascending: false });

  if (cursor?.success) {
    const { at, id } = cursor.data;
    query = query.or(`at.lt.${at},and(at.eq.${at},id.lt.${id})`);
  }

  const { data, error } = await query.limit(PAGE_SIZE + 1);
  if (error) return fail("internal_error", "The audit log could not be loaded.");

  const events = (data ?? []).map((event) => ({
    id: event.id,
    action: event.action,
    entity: event.entity,
    at: event.at,
  })) as AdminAuditEvent[];
  const hasMore = events.length > PAGE_SIZE;
  const page = events.slice(0, PAGE_SIZE);
  const last = page.at(-1);

  return ok({
    events: page,
    hasMore,
    nextCursor: hasMore && last ? { at: last.at, id: last.id } : null,
  });
}
