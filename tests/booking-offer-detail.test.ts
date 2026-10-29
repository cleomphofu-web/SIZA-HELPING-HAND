import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireActor: vi.fn(),
  getDatabaseNow: vi.fn(),
  bookingStatus: "assigned" as "open" | "assigned" | "in_progress" | "cancelled",
  helpersNeeded: 1,
  activeAssignment: false,
  priorAssignment: false,
  noShowHistory: [{ no_show_at: "2026-10-26T09:00:00.000Z", created_at: "2026-10-26T09:00:00.000Z", no_show_resolution: null as null | "proceed_fewer" | "close_vacant_slot" }],
  activeOffers: [{ slot: 1, offer_round: 2 }] as Array<{ slot: number; offer_round: number; helper_id: string; offered_at: string; expires_at: string }>,
  allOffers: [] as Array<{ booking_id: string; slot: number; offer_round: number; helper_id: string; offered_at: string; expires_at: string }>,
  maxOfferRounds: { 1: 2 } as Record<number, number>,
  profileDeletedAt: null as string | null,
  helperProfile: {
    status: "approved",
    services: ["home"],
    suburbs: ["Rosebank"],
    first_job_completed_at: null as string | null,
    subscription_status: "none" as string | null,
    subscription_paid_until: null as string | null,
  },
  helperAssignments: [] as Array<{ booking_id: string; status: string }>,
  acceptedBookings: [] as Array<{ id: string; start_at: string; end_at_est: string }>,
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/policies/auth", () => ({ requireActor: mocks.requireActor }));
vi.mock("@/server/views/database-time", () => ({ getDatabaseNow: mocks.getDatabaseNow }));
vi.mock("@/server/db/admin", () => ({
  createSupabaseAdminClient: () => ({
    from(table: string) {
      const filters = new Map<string, unknown>();
      const ordering: Array<{ key: string; ascending?: boolean }> = [];
      let wasLimited = false;
      const query: Record<string, unknown> = {};
      query.select = vi.fn(() => query);
      query.eq = vi.fn((key: string, value: unknown) => { filters.set(key, value); return query; });
      query.in = vi.fn((key: string, value: unknown) => { filters.set(key, value); return query; });
      query.gt = vi.fn((key: string, value: unknown) => { filters.set(key, value); return query; });
      query.is = vi.fn((key: string, value: unknown) => { filters.set(key, value); return query; });
      query.order = vi.fn((key: string, options?: { ascending?: boolean }) => { ordering.push({ key, ascending: options?.ascending }); return query; });
      query.limit = vi.fn(() => { wasLimited = true; return query; });
      query.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => {
        const data = table === "booking_offers"
          ? mocks.allOffers.filter((offer) =>
              (!filters.has("slot") || offer.slot === filters.get("slot"))
              && (!filters.has("helper_id") || offer.helper_id === filters.get("helper_id"))
              && (!filters.has("expires_at") || Date.parse(offer.expires_at) > Date.parse(String(filters.get("expires_at")))))
          : table === "booking_assignments" ? (filters.has("booking_id") ? [
            ...mocks.noShowHistory.map((row) => ({ ...row, booking_id: "11111111-1111-4111-8111-111111111111", helper_id: "helper-no-show", slot: 1, status: "no_show" })),
            ...(mocks.activeAssignment ? [{ booking_id: "11111111-1111-4111-8111-111111111111", helper_id: "helper-other", slot: 1, status: "accepted" }] : []),
            ...(mocks.priorAssignment ? [{ booking_id: "11111111-1111-4111-8111-111111111111", helper_id: "helper-1", slot: 2, status: "no_show" }] : []),
          ] : mocks.helperAssignments)
          : table === "phase_a_bookings" ? mocks.acceptedBookings
          : [];
        return Promise.resolve({ data, error: null }).then(resolve, reject);
      };
      query.maybeSingle = vi.fn(async () => {
        if (table === "booking_assignments") {
          if (filters.get("status") === "no_show") {
            const rows = [...mocks.noShowHistory];
            rows.sort((left, right) => {
              for (const order of ordering) {
                const compared = Date.parse(left[order.key as "no_show_at" | "created_at"]) - Date.parse(right[order.key as "no_show_at" | "created_at"]);
                if (compared) return order.ascending === false ? -compared : compared;
              }
              return 0;
            });
            return rows[0]
              ? { data: { status: "no_show", no_show_resolution: rows[0].no_show_resolution }, error: null }
              : { data: null, error: null };
          }
          if (filters.has("slot") && Array.isArray(filters.get("status")) && (filters.get("status") as unknown[]).includes("accepted")) return mocks.activeAssignment
            ? { data: { status: "accepted" }, error: null }
            : { data: null, error: null };
          if (wasLimited && filters.has("helper_id") && filters.has("booking_id")) return mocks.priorAssignment
            ? { data: { id: "assignment-prior" }, error: null }
            : { data: null, error: null };
          return { data: null, error: null };
        }
        if (table === "booking_offers") {
          if (filters.has("helper_id")) {
            return { data: mocks.activeOffers[0] ?? null, error: null };
          }
          const slot = Number(filters.get("slot"));
          return { data: { offer_round: mocks.maxOfferRounds[slot] }, error: null };
        }
        if (table === "helper_details") return { data: mocks.helperProfile, error: null };
        if (table === "profiles") return { data: { role: "helper", deleted_at: mocks.profileDeletedAt }, error: null };
        if (table === "phase_a_bookings") {
          if (filters.has("status") && filters.get("status") !== mocks.bookingStatus) return { data: null, error: null };
          return {
            data: {
              id: "11111111-1111-4111-8111-111111111111",
              suburb: "Rosebank",
              services: ["home"],
              helpers_needed: mocks.helpersNeeded,
              start_at: "2026-10-27T09:00:00.000Z",
              end_at_est: "2026-10-27T12:00:00.000Z",
              status: mocks.bookingStatus,
              pay_per_helper_cents: 10000,
              transport_per_helper_cents: 1000,
            },
            error: null,
          };
        }
        return { data: null, error: null };
      });
      return query;
    },
  }),
}));

import { getBookingView } from "@/server/views/booking-read";

describe("reopened helper offer detail", () => {
  beforeEach(() => {
    mocks.requireActor.mockReset().mockResolvedValue({ userId: "helper-1", role: "helper" });
    mocks.getDatabaseNow.mockReset().mockResolvedValue(new Date("2026-10-26T10:00:00.000Z"));
    mocks.bookingStatus = "assigned";
    mocks.helpersNeeded = 1;
    mocks.activeAssignment = false;
    mocks.priorAssignment = false;
    mocks.noShowHistory = [{ no_show_at: "2026-10-26T09:00:00.000Z", created_at: "2026-10-26T09:00:00.000Z", no_show_resolution: null }];
    mocks.activeOffers = [{ slot: 1, offer_round: 2, helper_id: "helper-1", offered_at: "2026-10-26T09:50:00.000Z", expires_at: "2026-10-26T10:10:00.000Z" }];
    mocks.allOffers = [{ booking_id: "11111111-1111-4111-8111-111111111111", slot: 1, offer_round: 2, helper_id: "helper-1", offered_at: "2026-10-26T09:50:00.000Z", expires_at: "2026-10-26T10:10:00.000Z" }];
    mocks.maxOfferRounds = { 1: 2 };
    mocks.profileDeletedAt = null;
    mocks.helperProfile = {
      status: "approved",
      services: ["home"],
      suburbs: ["Rosebank"],
      first_job_completed_at: null,
      subscription_status: "none",
      subscription_paid_until: null,
    };
    mocks.helperAssignments = [];
    mocks.acceptedBookings = [];
  });

  it.each(["assigned", "in_progress"] as const)("shows only pre-assignment fields for a reopened offer on %s booking", async (status) => {
    mocks.bookingStatus = status;
    const result = await getBookingView("11111111-1111-4111-8111-111111111111");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toMatchObject({ audience: "helper", id: "11111111-1111-4111-8111-111111111111", suburb: "Rosebank" });
      expect(result.data).not.toHaveProperty("address");
      expect(result.data).not.toHaveProperty("hostPhone");
    }
  });

  it("does not expose an old offer for an assigned booking when its slot was not reopened", async () => {
    mocks.noShowHistory = [];
    const result = await getBookingView("11111111-1111-4111-8111-111111111111");
    expect(result).toMatchObject({ ok: false, error: { code: "not_found" } });
  });

  it("hides offers for slots that have been filled", async () => {
    mocks.activeAssignment = true;
    const result = await getBookingView("11111111-1111-4111-8111-111111111111");
    expect(result).toMatchObject({ ok: false, error: { code: "not_found" } });
  });

  it("hides offers when the helper already has an assignment in this booking", async () => {
    mocks.priorAssignment = true;
    const result = await getBookingView("11111111-1111-4111-8111-111111111111");
    expect(result).toMatchObject({ ok: false, error: { code: "not_found" } });
  });

  it("hides an offer for a resolved no-show slot even while other booking slots remain open", async () => {
    mocks.bookingStatus = "open";
    mocks.noShowHistory = [{ no_show_at: "2026-10-26T09:00:00.000Z", created_at: "2026-10-26T09:00:00.000Z", no_show_resolution: "proceed_fewer" }];
    const result = await getBookingView("11111111-1111-4111-8111-111111111111");
    expect(result).toMatchObject({ ok: false, error: { code: "not_found" } });
  });

  it("blocks a slot if any no-show record is resolved, even when the latest is unresolved", async () => {
    mocks.noShowHistory = [
      { no_show_at: "2026-10-26T08:00:00.000Z", created_at: "2026-10-26T11:00:00.000Z", no_show_resolution: "close_vacant_slot" },
      { no_show_at: "2026-10-26T10:00:00.000Z", created_at: "2026-10-26T09:00:00.000Z", no_show_resolution: null },
    ];
    const result = await getBookingView("11111111-1111-4111-8111-111111111111");
    expect(result).toMatchObject({ ok: false, error: { code: "not_found" } });
  });

  it("rejects an earlier unresolved no-show when the latest no-show was resolved", async () => {
    mocks.noShowHistory = [
      { no_show_at: "2026-10-26T08:00:00.000Z", created_at: "2026-10-26T11:00:00.000Z", no_show_resolution: null },
      { no_show_at: "2026-10-26T10:00:00.000Z", created_at: "2026-10-26T09:00:00.000Z", no_show_resolution: "proceed_fewer" },
    ];
    const result = await getBookingView("11111111-1111-4111-8111-111111111111");
    expect(result).toMatchObject({ ok: false, error: { code: "not_found" } });
  });

  it("rejects an unexpired offer from an earlier no-show round", async () => {
    mocks.activeOffers = [{ slot: 1, offer_round: 2, helper_id: "helper-1", offered_at: "2026-10-26T09:50:00.000Z", expires_at: "2026-10-26T10:10:00.000Z" }];
    mocks.allOffers = [
      { booking_id: "11111111-1111-4111-8111-111111111111", slot: 1, offer_round: 2, helper_id: "helper-1", offered_at: "2026-10-26T09:50:00.000Z", expires_at: "2026-10-26T10:10:00.000Z" },
      { booking_id: "11111111-1111-4111-8111-111111111111", slot: 1, offer_round: 3, helper_id: "helper-selected-current", offered_at: "2026-10-26T09:55:00.000Z", expires_at: "2026-10-26T10:20:00.000Z" },
    ];
    mocks.maxOfferRounds = { 1: 3 };
    const result = await getBookingView("11111111-1111-4111-8111-111111111111");
    expect(result).toMatchObject({ ok: false, error: { code: "not_found" } });
  });

  it("handles several active slot offers without a maybeSingle ambiguity", async () => {
    mocks.bookingStatus = "open";
    mocks.helpersNeeded = 2;
    mocks.noShowHistory = [];
    mocks.activeOffers = [
      { slot: 1, offer_round: 2, helper_id: "helper-1", offered_at: "2026-10-26T09:50:00.000Z", expires_at: "2026-10-26T10:10:00.000Z" },
      { slot: 2, offer_round: 1, helper_id: "helper-1", offered_at: "2026-10-26T09:50:00.000Z", expires_at: "2026-10-26T10:10:00.000Z" },
    ];
    mocks.allOffers = [
      { booking_id: "11111111-1111-4111-8111-111111111111", slot: 1, offer_round: 2, helper_id: "helper-1", offered_at: "2026-10-26T09:50:00.000Z", expires_at: "2026-10-26T10:10:00.000Z" },
      { booking_id: "11111111-1111-4111-8111-111111111111", slot: 2, offer_round: 1, helper_id: "helper-1", offered_at: "2026-10-26T09:50:00.000Z", expires_at: "2026-10-26T10:10:00.000Z" },
    ];
    mocks.maxOfferRounds = { 1: 3, 2: 1 };
    const result = await getBookingView("11111111-1111-4111-8111-111111111111");
    expect(result.ok).toBe(true);
  });

  it("hides a current offer when approval was withdrawn after it was issued", async () => {
    mocks.helperProfile.status = "suspended";
    const result = await getBookingView("11111111-1111-4111-8111-111111111111");
    expect(result).toMatchObject({ ok: false, error: { code: "not_found" } });
  });

  it("hides a current offer when the helper subscription has lapsed", async () => {
    mocks.helperProfile.first_job_completed_at = "2026-01-01T00:00:00.000Z";
    mocks.helperProfile.subscription_status = "active";
    mocks.helperProfile.subscription_paid_until = "2026-10-26T09:59:59.999Z";
    const result = await getBookingView("11111111-1111-4111-8111-111111111111");
    expect(result).toMatchObject({ ok: false, error: { code: "not_found" } });
  });

  it("hides a current offer when an accepted job now overlaps", async () => {
    mocks.helperAssignments = [{ booking_id: "booking-other", status: "accepted" }];
    mocks.acceptedBookings = [{
      id: "booking-other",
      start_at: "2026-10-27T11:00:00.000Z",
      end_at_est: "2026-10-27T13:00:00.000Z",
    }];
    const result = await getBookingView("11111111-1111-4111-8111-111111111111");
    expect(result).toMatchObject({ ok: false, error: { code: "not_found" } });
  });

  it("hides offers after the helper profile is soft-deleted", async () => {
    mocks.profileDeletedAt = "2026-10-26T09:59:00.000Z";
    const result = await getBookingView("11111111-1111-4111-8111-111111111111");
    expect(result).toMatchObject({ ok: false, error: { code: "not_found" } });
  });

  it("opens an expired rotation offer to another currently eligible helper", async () => {
    mocks.bookingStatus = "open";
    mocks.noShowHistory = [];
    mocks.activeOffers = [];
    mocks.allOffers = [{
      booking_id: "11111111-1111-4111-8111-111111111111",
      slot: 1,
      offer_round: 1,
      helper_id: "helper-selected-earlier",
      offered_at: "2026-10-26T09:40:00.000Z",
      expires_at: "2026-10-26T09:50:00.000Z",
    }];
    const result = await getBookingView("11111111-1111-4111-8111-111111111111");
    expect(result.ok).toBe(true);
  });

  it("opens an expired reopened no-show round to another currently eligible helper", async () => {
    mocks.bookingStatus = "assigned";
    mocks.allOffers = [{
      booking_id: "11111111-1111-4111-8111-111111111111",
      slot: 1,
      offer_round: 2,
      helper_id: "helper-selected-earlier",
      offered_at: "2026-10-26T09:50:00.000Z",
      expires_at: "2026-10-26T09:55:00.000Z",
    }];
    const result = await getBookingView("11111111-1111-4111-8111-111111111111");
    expect(result.ok).toBe(true);
  });
});
