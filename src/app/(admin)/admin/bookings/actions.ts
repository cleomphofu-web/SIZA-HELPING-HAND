"use server";

import { AdminAssignmentInputSchema, AdminBookingIdSchema, AdminBookingStatusInputSchema } from "@/server/domain/admin-assignment";
import { requireAdmin } from "@/server/policies/auth";
import { runServerActionPipeline } from "@/server/policies/request-pipeline";
import { fail, type Result } from "@/server/services/result";
import { assignAdminShortlistedHelpers, loadAdminShortlistRows, setAdminBookingStatus } from "@/server/services/admin-assignments";
import { limitAdminAction } from "@/server/security/admin-rate-limit";
import { toAdminShortlistSelection } from "@/server/views/admin-shortlist";

export async function getShortlist(bookingId: unknown): Promise<Result<ReturnType<typeof toAdminShortlistSelection>>> {
  await requireAdmin();
  const parsed = AdminBookingIdSchema.safeParse(bookingId);
  if (!parsed.success) return fail("validation_failed", "That request is not valid.");
  const rows = await loadAdminShortlistRows(parsed.data);
  return rows.ok ? { ok: true as const, data: toAdminShortlistSelection(rows.data) } : rows;
}

export async function assignHelpers(bookingId: unknown, selection: unknown) {
  const pipeline = await runServerActionPipeline({
    rateLimit: limitAdminAction, botCheck: async () => true,
    validate: async () => { const parsed = AdminAssignmentInputSchema.safeParse({ bookingId, selection }); return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "invalid" }; },
    authorize: async () => ({ ok: true as const, data: await requireAdmin() }),
    service: (input, admin) => assignAdminShortlistedHelpers(admin.userId, input.bookingId, input.selection.version, input.selection.indexes),
  });
  if (!pipeline.ok) return pipeline.stage === "rate_limit" ? fail("rate_limited", "Please wait before trying this again.") : fail("validation_failed", "Choose one to four valid helpers and try again.");
  return pipeline.data;
}

export async function setBookingStatus(bookingId: unknown, status: unknown) {
  const pipeline = await runServerActionPipeline({
    rateLimit: limitAdminAction, botCheck: async () => true,
    validate: async () => { const parsed = AdminBookingStatusInputSchema.safeParse({ bookingId, status }); return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "invalid" }; },
    authorize: async () => ({ ok: true as const, data: await requireAdmin() }),
    service: (input, admin) => setAdminBookingStatus(admin.userId, input.bookingId, input.status),
  });
  if (!pipeline.ok) return pipeline.stage === "rate_limit" ? fail("rate_limited", "Please wait before trying this again.") : fail("validation_failed", "That request status is not valid.");
  return pipeline.data;
}
