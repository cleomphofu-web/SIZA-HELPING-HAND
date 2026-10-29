export type BookingStatus = "open" | "assigned" | "in_progress" | "completed" | "cancelled" | "disputed" | "expired";
export type BookingEvent = "assign" | "check_in" | "complete" | "cancel" | "expire" | "dispute" | "resolve_complete" | "resolve_cancel";

const allowed: Record<BookingStatus, Partial<Record<BookingEvent, BookingStatus>>> = {
  open: { assign: "assigned", cancel: "cancelled", expire: "expired" },
  assigned: { check_in: "in_progress", cancel: "cancelled", dispute: "disputed" },
  in_progress: { complete: "completed", dispute: "disputed" },
  completed: { dispute: "disputed" },
  cancelled: {},
  disputed: { resolve_complete: "completed", resolve_cancel: "cancelled" },
  expired: {},
};

export function transitionBooking(status: BookingStatus, event: BookingEvent): BookingStatus {
  const next = allowed[status][event];
  if (!next) throw new Error(`Invalid booking transition: ${status} -> ${event}`);
  return next;
}
