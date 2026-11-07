import "server-only";
import { createSupabaseAdminClient } from "@/server/db/admin";
import { requireActor } from "@/server/policies/auth";
import { fail, ok, type Result } from "@/server/services/result";
import { createNotification } from "@/server/services/notifications";

// ── Types ──────────────────────────────────────────────────────────────────

export type BookingMessage = {
  id: string;
  bookingId: string;
  senderId: string;
  senderRole: "host" | "helper" | "admin";
  senderFirstName: string;
  message: string;
  createdAt: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Checks whether the current actor is authorised to access messages on this
 * booking. Returns the host_id and the matching assignment id (if helper), or
 * null if the actor has no access.
 */
async function resolveAccess(bookingId: string): Promise<
  | {
      ok: true;
      actorId: string;
      actorRole: "host" | "helper" | "admin";
      hostId: string;
      assignedHelperIds: string[];
    }
  | { ok: false; reason: "unauthenticated" | "forbidden" | "not_found" }
> {
  let actor: { userId: string; role: string };
  try {
    actor = await requireActor();
  } catch {
    return { ok: false, reason: "unauthenticated" };
  }

  if (!["host", "helper", "admin"].includes(actor.role)) {
    return { ok: false, reason: "forbidden" };
  }

  const db = createSupabaseAdminClient();

  const { data: booking, error: bookingError } = await db
    .from("phase_a_bookings")
    .select("id, host_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError || !booking) {
    return { ok: false, reason: "not_found" };
  }

  // Admin can always access
  if (actor.role === "admin") {
    return {
      ok: true,
      actorId: actor.userId,
      actorRole: "admin",
      hostId: booking.host_id as string,
      assignedHelperIds: [],
    };
  }

  // Host must own the booking
  if (actor.role === "host") {
    if (booking.host_id !== actor.userId) {
      return { ok: false, reason: "forbidden" };
    }
    // Fetch assigned helper ids for notification purposes
    const { data: assignments } = await db
      .from("booking_assignments")
      .select("helper_id")
      .eq("booking_id", bookingId)
      .in("status", ["accepted", "completed"]);

    return {
      ok: true,
      actorId: actor.userId,
      actorRole: "host",
      hostId: booking.host_id as string,
      assignedHelperIds: (assignments ?? []).map((a: { helper_id: string }) => a.helper_id),
    };
  }

  // Helper must have an accepted or completed assignment on this booking
  const { data: assignment } = await db
    .from("booking_assignments")
    .select("helper_id")
    .eq("booking_id", bookingId)
    .eq("helper_id", actor.userId)
    .in("status", ["accepted", "completed"])
    .maybeSingle();

  if (!assignment) {
    return { ok: false, reason: "forbidden" };
  }

  // Also fetch sibling helper ids (for multi-helper bookings)
  const { data: allAssignments } = await db
    .from("booking_assignments")
    .select("helper_id")
    .eq("booking_id", bookingId)
    .in("status", ["accepted", "completed"]);

  return {
    ok: true,
    actorId: actor.userId,
    actorRole: "helper",
    hostId: booking.host_id as string,
    assignedHelperIds: (allAssignments ?? []).map((a: { helper_id: string }) => a.helper_id),
  };
}

// ── Read ───────────────────────────────────────────────────────────────────

/**
 * Returns up to 100 messages for the given booking, ordered oldest-first.
 * The caller must be the booking's host, an assigned helper, or admin.
 */
export async function getBookingMessages(
  bookingId: string,
): Promise<Result<BookingMessage[]>> {
  const access = await resolveAccess(bookingId);
  if (!access.ok) {
    if (access.reason === "unauthenticated") return fail("unauthenticated", "Sign in to view messages.");
    if (access.reason === "not_found") return fail("not_found", "Booking not found.");
    return fail("forbidden", "You do not have access to this booking.");
  }

  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("booking_messages")
    .select("id, booking_id, sender_id, sender_role, sender_first_name, message, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) return fail("internal_error", "Could not load messages.");

  const messages: BookingMessage[] = (data ?? []).map((row) => ({
    id: row.id as string,
    bookingId: row.booking_id as string,
    senderId: row.sender_id as string,
    senderRole: row.sender_role as "host" | "helper" | "admin",
    senderFirstName: row.sender_first_name as string,
    message: row.message as string,
    createdAt: row.created_at as string,
  }));

  return ok(messages);
}

// ── Write ──────────────────────────────────────────────────────────────────

/**
 * Posts a new message to the booking's arrival notes board.
 * The caller must be the booking's host, an assigned helper, or admin.
 * After inserting, fires an in-app notification for the other party.
 */
export async function postBookingMessage(
  bookingId: string,
  message: string,
): Promise<Result<BookingMessage>> {
  if (!message || message.trim().length === 0) {
    return fail("validation_failed", "Message cannot be empty.");
  }
  if (message.trim().length > 1000) {
    return fail("validation_failed", "Message must be 1,000 characters or fewer.");
  }

  const access = await resolveAccess(bookingId);
  if (!access.ok) {
    if (access.reason === "unauthenticated") return fail("unauthenticated", "Sign in to post a message.");
    if (access.reason === "not_found") return fail("not_found", "Booking not found.");
    return fail("forbidden", "You do not have access to this booking.");
  }

  const db = createSupabaseAdminClient();

  // Resolve sender first name
  const { data: profile } = await db
    .from("profiles")
    .select("first_name")
    .eq("id", access.actorId)
    .maybeSingle();

  const senderFirstName =
    (profile as { first_name?: string } | null)?.first_name ?? "User";

  const { data: row, error: insertError } = await db
    .from("booking_messages")
    .insert({
      booking_id: bookingId,
      sender_id: access.actorId,
      sender_role: access.actorRole,
      sender_first_name: senderFirstName,
      message: message.trim(),
    })
    .select("id, booking_id, sender_id, sender_role, sender_first_name, message, created_at")
    .single();

  if (insertError || !row) {
    return fail("internal_error", "Could not post message.");
  }

  const newMessage: BookingMessage = {
    id: row.id as string,
    bookingId: row.booking_id as string,
    senderId: row.sender_id as string,
    senderRole: row.sender_role as "host" | "helper" | "admin",
    senderFirstName: row.sender_first_name as string,
    message: row.message as string,
    createdAt: row.created_at as string,
  };

  // Fire notifications for the other party (best-effort — do not block response)
  try {
    if (access.actorRole === "host") {
      // Notify all assigned helpers
      for (const helperId of access.assignedHelperIds) {
        if (helperId === access.actorId) continue;
        await createNotification({
          userId: helperId,
          kind: "booking_message",
          title: `${senderFirstName} left an arrival note`,
          body: message.trim().slice(0, 120),
          actionPath: `/helper/jobs/${bookingId}`,
          referenceId: bookingId,
        });
      }
    } else {
      // Helper or admin — notify host
      await createNotification({
        userId: access.hostId,
        kind: "booking_message",
        title: `${senderFirstName} left an arrival note`,
        body: message.trim().slice(0, 120),
        actionPath: `/app/requests/${bookingId}`,
        referenceId: bookingId,
      });
    }
  } catch {
    // Notifications are best-effort — do not fail the write
  }

  return ok(newMessage);
}

