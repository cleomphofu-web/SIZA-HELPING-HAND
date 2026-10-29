export type BookingReadActor = {
  userId: string;
  role: "host" | "helper" | "admin";
};

export type BookingAssignmentRead = {
  helperId: string;
  firstName: string;
  phone: string;
  status: "accepted" | "cancelled" | "completed" | "no_show";
  checkedInAt?: string | null;
};

export type BookingNoShowSlotRead = { slot: number; noShowAt: string | null; resolution: "proceed_fewer" | "close_vacant_slot" | null; canResolve: boolean; canProceedWithFewer: boolean };

export type BookingReadRecord = {
  id: string;
  hostId: string;
  suburb: string;
  city: string;
  address: string;
  accessNotes: string;
  hostFirstName: string;
  hostPhone: string;
  payPerHelperCents: number | string;
  transportPerHelperCents: number | string;
  services: string[];
  helpersNeeded: number;
  startAt: string;
  endAt: string;
  status: "open" | "assigned" | "in_progress" | "completed" | "cancelled" | "disputed" | "expired";
  assignments: BookingAssignmentRead[];
  noShowSlots: BookingNoShowSlotRead[];
  noShowRecoveryMinutes: number | null;
};

export type HostBookingView = {
  audience: "host";
  id: string;
  suburb: string;
  city: string;
  address: string;
  accessNotes: string;
  services: string[];
  helpersNeeded: number;
  startAt: string;
  endAt: string;
  status: BookingReadRecord["status"];
  payPerHelperCents: number | string;
  transportPerHelperCents: number | string;
  assignedHelpers: Array<{ helperId: string; firstName: string; phone: string; checkedInAt: string | null }>;
  noShowSlots: BookingNoShowSlotRead[];
  noShowRecoveryMinutes: number | null;
};

export type HelperBookingView = {
  audience: "helper";
  id: string;
  suburb: string;
  payPerHelperCents: number | string;
  transportPerHelperCents: number | string;
  status?: BookingReadRecord["status"];
  startAt?: string;
  endAt?: string;
  services?: string[];
  address?: string;
  hostFirstName?: string;
  hostPhone?: string;
  checkedInAt?: string | null;
};

export type AdminBookingView = {
  audience: "admin";
  id: string;
  suburb: string;
  city: string;
  address: string;
  accessNotes: string;
  services: string[];
  helpersNeeded: number;
  startAt: string;
  endAt: string;
  status: BookingReadRecord["status"];
  payPerHelperCents: number | string;
  transportPerHelperCents: number | string;
};

export type BookingView = HostBookingView | HelperBookingView | AdminBookingView;

const assignedStatuses = new Set<BookingReadRecord["status"]>(["assigned", "in_progress", "completed", "disputed"]);

export function viewBookingForHost(booking: BookingReadRecord, actor: BookingReadActor): HostBookingView | null {
  if (actor.role !== "host" || actor.userId !== booking.hostId) return null;

  const acceptedAssignments = booking.assignments.filter(
    (assignment) => assignment.status === "accepted" || assignment.status === "completed",
  );
  const latestNoShowBySlot = new Map<number, BookingReadRecord["noShowSlots"][number]>();
  for (const slot of booking.noShowSlots) {
    const current = latestNoShowBySlot.get(slot.slot);
    if (!current || Date.parse(slot.noShowAt ?? "") >= Date.parse(current.noShowAt ?? "")) latestNoShowBySlot.set(slot.slot, slot);
  }
  const requiredAssignedHelpers = Math.max(0, booking.helpersNeeded - latestNoShowBySlot.size);
  const assignedHelpers = assignedStatuses.has(booking.status) && acceptedAssignments.length >= requiredAssignedHelpers
    ? acceptedAssignments.map(({ helperId, firstName, phone, checkedInAt }) => ({ helperId, firstName, phone, checkedInAt: checkedInAt ?? null }))
    : [];

  return {
    audience: "host",
    id: booking.id,
    suburb: booking.suburb,
    city: booking.city,
    address: booking.address,
    accessNotes: booking.accessNotes,
    services: [...booking.services],
    helpersNeeded: booking.helpersNeeded,
    startAt: booking.startAt,
    endAt: booking.endAt,
    status: booking.status,
    payPerHelperCents: booking.payPerHelperCents,
    transportPerHelperCents: booking.transportPerHelperCents,
    assignedHelpers,
    noShowSlots: [...latestNoShowBySlot.values()].sort((left, right) => left.slot - right.slot),
    noShowRecoveryMinutes: booking.noShowRecoveryMinutes,
  };
}

export function viewBookingForHelper(
  booking: BookingReadRecord,
  actor: BookingReadActor,
  access: "offered" | "assigned" | "history" | "none",
): HelperBookingView | null {
  if (actor.role !== "helper" || access === "none") return null;

  const base: HelperBookingView = {
    audience: "helper",
    id: booking.id,
    suburb: booking.suburb,
    payPerHelperCents: booking.payPerHelperCents,
    transportPerHelperCents: booking.transportPerHelperCents,
  };
  const assignment = booking.assignments.find((item) => item.helperId === actor.userId);
  if (access === "assigned" && assignment?.status !== "accepted") return null;
  if (access === "history" && assignment?.status !== "completed") return null;
  if (access === "offered") return base;

  if (access === "history") {
    return {
      ...base,
      status: booking.status,
      startAt: booking.startAt,
      endAt: booking.endAt,
      services: [...booking.services],
      checkedInAt: assignment?.checkedInAt ?? null,
    };
  }

  return {
    ...base,
    status: booking.status,
    startAt: booking.startAt,
    endAt: booking.endAt,
    services: [...booking.services],
    address: booking.address,
    hostFirstName: booking.hostFirstName,
    hostPhone: booking.hostPhone,
    checkedInAt: assignment?.checkedInAt ?? null,
  };
}

export function viewBookingForAdmin(
  booking: BookingReadRecord,
  actor: BookingReadActor,
  isAdminMember: boolean,
): AdminBookingView | null {
  if (actor.role !== "admin" || !isAdminMember) return null;

  return {
    audience: "admin",
    id: booking.id,
    suburb: booking.suburb,
    city: booking.city,
    address: booking.address,
    accessNotes: booking.accessNotes,
    services: [...booking.services],
    helpersNeeded: booking.helpersNeeded,
    startAt: booking.startAt,
    endAt: booking.endAt,
    status: booking.status,
    payPerHelperCents: booking.payPerHelperCents,
    transportPerHelperCents: booking.transportPerHelperCents,
  };
}
