import "server-only";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { fail, ok, type Result } from "@/server/services/result";

// ── Types ──────────────────────────────────────────────────────────────────

export type NotificationKind =
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_completed"
  | "helper_on_my_way"
  | "helper_arrived"
  | "job_offer"
  | "no_show_resolved"
  | "subscription_reminder"
  | "booking_message";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  actionPath: string | null;
  referenceId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationSummary = {
  notifications: Notification[];
  unreadCount: number;
};

// ── Read ───────────────────────────────────────────────────────────────────

/** Returns the 30 most recent notifications for the signed-in user. */
export async function getNotifications(): Promise<Result<NotificationSummary>> {
  let actor;
  try { actor = await requireActor(); } catch { return fail("unauthenticated", "Sign in to view notifications."); }

  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from("in_app_notifications")
    .select("id, kind, title, body, action_path, reference_id, read_at, created_at")
    .eq("user_id", actor.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return fail("internal_error", "Could not load notifications.");

  const notifications: Notification[] = (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind as NotificationKind,
    title: row.title,
    body: row.body,
    actionPath: row.action_path ?? null,
    referenceId: row.reference_id ?? null,
    readAt: row.read_at ?? null,
    createdAt: row.created_at,
  }));

  const unreadCount = notifications.filter((n) => n.readAt === null).length;

  return ok({ notifications, unreadCount });
}

// ── Mark read ──────────────────────────────────────────────────────────────

/** Marks all unread notifications for the signed-in user as read. */
export async function markAllNotificationsRead(): Promise<Result<{ markedCount: number }>> {
  let actor;
  try { actor = await requireActor(); } catch { return fail("unauthenticated", "Sign in to update notifications."); }

  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from("in_app_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", actor.id)
    .is("read_at", null)
    .select("id");

  if (error) return fail("internal_error", "Could not mark notifications as read.");

  return ok({ markedCount: (data ?? []).length });
}

// ── Create (server-internal only, not exposed to client directly) ──────────

export type CreateNotificationInput = {
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  actionPath?: string;
  referenceId?: string;
};

/**
 * Creates a notification for a user. Called server-side only — from booking
 * flows, rotation service, etc. Never from client code.
 */
export async function createNotification(input: CreateNotificationInput): Promise<Result<{ id: string }>> {
  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from("in_app_notifications")
    .insert({
      user_id: input.userId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      action_path: input.actionPath ?? null,
      reference_id: input.referenceId ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return fail("internal_error", "Could not create notification.");
  return ok({ id: data.id });
}

