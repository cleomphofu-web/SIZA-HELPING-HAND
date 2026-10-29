import type { BookingReadRecord } from "@/server/views/booking";

export const hostBookingStatusCopy = {
  open: "host.home.status.open",
  assigned: "host.home.status.assigned",
  in_progress: "host.home.status.in_progress",
  completed: "host.home.status.completed",
  cancelled: "host.home.status.cancelled",
  disputed: "host.home.status.disputed",
  expired: "host.home.status.expired",
} as const satisfies Record<BookingReadRecord["status"], string>;

const dateFormatter = new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Johannesburg",
});

export function formatHostBookingDate(value: string) {
  return dateFormatter.format(new Date(value));
}
