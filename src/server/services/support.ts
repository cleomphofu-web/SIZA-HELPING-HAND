import "server-only";

import { ok, fail } from "@/server/services/result";
import type { Result } from "@/server/services/result";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export type TicketCategory = "payment" | "booking" | "helper_issue" | "account" | "other";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface CreateTicketInput {
  userId: string;
  category: TicketCategory;
  subject: string;
  message: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  category: TicketCategory;
  subject: string;
  message: string;
  status: TicketStatus;
  adminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

/**
 * Create a new customer support ticket.
 */
export async function createSupportTicket(
  db: Db,
  input: CreateTicketInput,
): Promise<Result<{ ticketId: string }>> {
  if (input.subject.trim().length < 5 || input.subject.length > 200) {
    return fail("validation_failed", "Subject must be between 5 and 200 characters");
  }

  if (input.message.trim().length < 10 || input.message.length > 5000) {
    return fail("validation_failed", "Message must be between 10 and 5000 characters");
  }

  const { data, error } = await db
    .from("support_tickets")
    .insert({
      user_id: input.userId,
      category: input.category,
      subject: input.subject.trim(),
      message: input.message.trim(),
      status: "open",
    })
    .select("id")
    .single();

  if (error || !data) {
    return fail("internal_error", "Failed to create support ticket");
  }

  return ok({ ticketId: data.id as string });
}

/**
 * List support tickets created by a specific user.
 */
export async function listUserTickets(
  db: Db,
  userId: string,
): Promise<Result<SupportTicket[]>> {
  const { data, error } = await db
    .from("support_tickets")
    .select("id, user_id, category, subject, message, status, admin_note, resolved_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return fail("internal_error", "Failed to retrieve support tickets");
  }

  const tickets = (data || []).map((t: Record<string, unknown>) => ({
    id: t.id as string,
    userId: t.user_id as string,
    category: t.category as TicketCategory,
    subject: t.subject as string,
    message: t.message as string,
    status: t.status as TicketStatus,
    adminNote: (t.admin_note as string) || null,
    resolvedAt: (t.resolved_at as string) || null,
    createdAt: t.created_at as string,
  }));

  return ok(tickets);
}

/**
 * Admin updates ticket status and adds resolution note.
 */
export async function resolveSupportTicket(
  db: Db,
  input: {
    ticketId: string;
    status: TicketStatus;
    adminNote?: string;
  },
): Promise<Result<{ resolved: boolean }>> {
  const { error } = await db
    .from("support_tickets")
    .update({
      status: input.status,
      admin_note: input.adminNote ?? null,
      resolved_at: input.status === "resolved" || input.status === "closed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.ticketId);

  if (error) {
    return fail("internal_error", "Failed to update support ticket");
  }

  return ok({ resolved: true });
}
