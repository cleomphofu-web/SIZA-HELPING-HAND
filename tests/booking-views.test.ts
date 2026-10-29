import { describe, expect, it } from "vitest";
import {
  viewBookingForAdmin,
  viewBookingForHelper,
  viewBookingForHost,
  type BookingReadActor,
  type BookingReadRecord,
} from "@/server/views/booking";

const booking: BookingReadRecord = {
  id: "booking-1",
  hostId: "host-1",
  suburb: "Soweto",
  city: "Johannesburg",
  address: "1 Private Street",
  accessNotes: "Gate code 1234",
  hostFirstName: "Ava",
  hostPhone: "+27821234567",
  payPerHelperCents: 50000,
  transportPerHelperCents: 5000,
  services: ["home"],
  helpersNeeded: 1,
  startAt: "2026-10-20T08:00:00.000Z",
  endAt: "2026-10-20T12:00:00.000Z",
  status: "open",
  assignments: [{ helperId: "helper-1", firstName: "Sam", phone: "+27829876543", status: "accepted" }],
  noShowSlots: [],
  noShowRecoveryMinutes: null,
};

const helperActor: BookingReadActor = { userId: "helper-1", role: "helper" };

describe("actor-aware booking views", () => {
  it("does not return a host view to a wrong-role actor or a different host", () => {
    expect(viewBookingForHost(booking, { userId: "host-1", role: "helper" })).toBeNull();
    expect(viewBookingForHost(booking, { userId: "host-2", role: "host" })).toBeNull();
  });

  it("shows a host their own address but withholds helper phones before full assignment", () => {
    const view = viewBookingForHost(booking, { userId: "host-1", role: "host" });

    expect(view).toMatchObject({ address: "1 Private Street", accessNotes: "Gate code 1234" });
    expect(view).not.toHaveProperty("assignedHelpers.0.phone");
  });

  it("reveals assigned helper contact details to the booking host after assignment", () => {
    const view = viewBookingForHost({ ...booking, status: "assigned" }, { userId: "host-1", role: "host" });

    expect(view).toMatchObject({ assignedHelpers: [{ helperId: "helper-1", firstName: "Sam", phone: "+27829876543" }] });
  });

  it("keeps remaining assigned helper contact visible after another slot no-shows", () => {
    const partial = {
      ...booking,
      status: "assigned" as const,
      helpersNeeded: 2,
      noShowSlots: [{ slot: 1, noShowAt: "2026-10-20T09:00:00.000Z", resolution: null, canResolve: false, canProceedWithFewer: false }],
      assignments: [booking.assignments[0]!],
    };
    const view = viewBookingForHost(partial, { userId: "host-1", role: "host" });
    expect(view?.assignedHelpers).toMatchObject([{ helperId: "helper-1", phone: "+27829876543" }]);
  });

  it("withholds helper contacts until every requested slot is assigned", () => {
    const partial = viewBookingForHost({ ...booking, status: "assigned", helpersNeeded: 2 }, { userId: "host-1", role: "host" });
    expect(partial?.assignedHelpers).toEqual([]);
  });

  it("limits an offered but unassigned helper to the pre-assignment fields", () => {
    const view = viewBookingForHelper(booking, { userId: "helper-2", role: "helper" }, "offered");

    expect(view).toEqual({
      audience: "helper",
      id: "booking-1",
      suburb: "Soweto",
      payPerHelperCents: 50000,
      transportPerHelperCents: 5000,
    });
    expect(view).not.toHaveProperty("address");
    expect(view).not.toHaveProperty("hostPhone");
    expect(view).not.toHaveProperty("accessNotes");
  });

  it("reveals address and host contact only to the helper assigned to the booking", () => {
    const view = viewBookingForHelper(booking, helperActor, "assigned");

    expect(view).toMatchObject({ address: "1 Private Street", hostFirstName: "Ava", hostPhone: "+27821234567" });
    expect(view).not.toHaveProperty("accessNotes");
  });

  it("keeps completed booking history redacted from current host contact details", () => {
    const completed = { ...booking, status: "completed" as const, assignments: [{ ...booking.assignments[0], status: "completed" as const }] };
    const view = viewBookingForHelper(completed, helperActor, "history");

    expect(view).toMatchObject({ audience: "helper", id: "booking-1", status: "completed", services: ["home"] });
    expect(view).not.toHaveProperty("address");
    expect(view).not.toHaveProperty("hostPhone");
  });

  it("denies a wrong-role helper and a helper without an offer or assignment", () => {
    expect(viewBookingForHelper(booking, { userId: "host-1", role: "host" }, "assigned")).toBeNull();
    expect(viewBookingForHelper(booking, { userId: "helper-2", role: "helper" }, "none")).toBeNull();
    expect(viewBookingForHelper(booking, { userId: "helper-2", role: "helper" }, "assigned")).toBeNull();
  });

  it("requires both admin role and admin membership for the admin view", () => {
    expect(viewBookingForAdmin(booking, { userId: "host-1", role: "host" }, true)).toBeNull();
    expect(viewBookingForAdmin(booking, { userId: "admin-1", role: "admin" }, false)).toBeNull();
    const view = viewBookingForAdmin(booking, { userId: "admin-1", role: "admin" }, true);
    expect(view).toMatchObject({ id: "booking-1", suburb: "Soweto" });
    expect(view).not.toHaveProperty("hostId");
    expect(view).not.toHaveProperty("assignedHelpers");
    expect(view).not.toHaveProperty("host");
  });

  it("never includes encrypted identifiers or document paths in any actor view", () => {
    const privateRecord = {
      ...booking,
      idNumberEncrypted: "ciphertext",
      idHash: "hash",
      storagePath: "private/identity.png",
    } as BookingReadRecord;

    const views = [
      viewBookingForHost(privateRecord, { userId: "host-1", role: "host" }),
      viewBookingForHelper(privateRecord, helperActor, "assigned"),
      viewBookingForAdmin(privateRecord, { userId: "admin-1", role: "admin" }, true),
    ];

    for (const view of views) {
      expect(view).not.toHaveProperty("idNumberEncrypted");
      expect(view).not.toHaveProperty("idHash");
      expect(view).not.toHaveProperty("storagePath");
    }
  });
});
