import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  limit: vi.fn(),
  sameOrigin: vi.fn(),
  requireActor: vi.fn(),
  db: {
    from: vi.fn(),
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/admin", () => ({
  createSupabaseAdminClient: () => mocks.db,
}));
vi.mock("@/server/security/request-rate-limit", () => ({
  limitRequest: mocks.limit,
}));
vi.mock("@/server/security/origin", () => ({
  sameOrigin: mocks.sameOrigin,
}));
vi.mock("@/server/policies/auth", () => ({
  requireActor: mocks.requireActor,
}));

import { POST, GET } from "@/app/api/bookings/[id]/on-my-way/route";

function makeRequest(bookingId: string, body?: Record<string, unknown>) {
  return new NextRequest(`http://localhost:3000/api/bookings/${bookingId}/on-my-way`, {
    method: "POST",
    headers: { origin: "http://localhost:3000", "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("on-my-way route", () => {
  beforeEach(() => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "true");
    mocks.limit.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 60 });
    mocks.sameOrigin.mockReset().mockReturnValue(true);
    mocks.requireActor.mockReset().mockResolvedValue({ userId: "helper-1", role: "helper" });
  });

  it("rejects non-helper actors with 403", async () => {
    mocks.requireActor.mockResolvedValueOnce({ userId: "host-1", role: "host" });
    const response = await POST(makeRequest("b-1"), {
      params: Promise.resolve({ id: "b-1" }),
    });
    expect(response.status).toBe(403);
  });

  it("rejects when helper is not assigned to the booking", async () => {
    mocks.db.from.mockImplementation((table: string) => {
      if (table === "booking_assignments") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      return { select: () => ({}) };
    });

    const response = await POST(makeRequest("b-1"), {
      params: Promise.resolve({ id: "b-1" }),
    });
    expect(response.status).toBe(403);
  });

  it("returns whatsappUrl when assignment and host details exist", async () => {
    mocks.db.from.mockImplementation((table: string) => {
      if (table === "booking_assignments") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { id: "assign-1", status: "accepted" },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "phase_a_bookings") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: "b-1", status: "assigned", host_id: "host-1", starts_at: "2026-11-04T14:00:00Z" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: () => ({
            eq: (col: string, val: string) => ({
              maybeSingle: async () => {
                if (val === "host-1") {
                  return { data: { first_name: "John", phone: "0821234567" }, error: null };
                }
                return { data: { first_name: "Sarah" }, error: null };
              },
            }),
          }),
        };
      }
      return { select: () => ({}) };
    });

    const response = await POST(makeRequest("b-1"), {
      params: Promise.resolve({ id: "b-1" }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.whatsappUrl).toContain("wa.me/27821234567");
    expect(json.whatsappUrl).toContain("Sarah");
    expect(json.etaMinutes).toBe(30);
  });

  it("accepts custom etaMinutes and includes it in response", async () => {
    mocks.db.from.mockImplementation((table: string) => {
      if (table === "booking_assignments") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { id: "assign-1", status: "accepted" },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "phase_a_bookings") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: "b-1", status: "assigned", host_id: "host-1", starts_at: "2026-11-04T14:00:00Z" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: () => ({
            eq: (col: string, val: string) => ({
              maybeSingle: async () => {
                if (val === "host-1") {
                  return { data: { first_name: "John", phone: "0821234567" }, error: null };
                }
                return { data: { first_name: "Sarah" }, error: null };
              },
            }),
          }),
        };
      }
      if (table === "analytics_events") {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({ data: { id: "evt-1" }, error: null }),
            }),
          }),
        };
      }
      return { select: () => ({}) };
    });

    const response = await POST(makeRequest("b-1", { etaMinutes: 45 }), {
      params: Promise.resolve({ id: "b-1" }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.etaMinutes).toBe(45);
    expect(json.success).toBe(true);
    expect(json.whatsappUrl).toContain("45%20minutes");
  });

  describe("GET /api/bookings/[id]/on-my-way", () => {
    function makeGetRequest(bookingId: string) {
      return new NextRequest(`http://localhost:3000/api/bookings/${bookingId}/on-my-way`, {
        method: "GET",
        headers: { origin: "http://localhost:3000" },
      });
    }

    it("returns null enRoute when helper has not tapped on-my-way", async () => {
      mocks.requireActor.mockResolvedValueOnce({ userId: "host-1", role: "host" });
      mocks.db.from.mockImplementation((table: string) => {
        if (table === "phase_a_bookings") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: "b-1", status: "assigned", host_id: "host-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "analytics_events") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: async () => ({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        return { select: () => ({}) };
      });

      const response = await GET(makeGetRequest("b-1"), {
        params: Promise.resolve({ id: "b-1" }),
      });
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.bookingId).toBe("b-1");
      expect(json.status).toBe("assigned");
      expect(json.enRoute).toBeNull();
    });

    it("returns enRoute ETA and departure time when event exists", async () => {
      mocks.requireActor.mockResolvedValueOnce({ userId: "host-1", role: "host" });
      const departureTime = "2026-11-06T10:00:00.000Z";
      mocks.db.from.mockImplementation((table: string) => {
        if (table === "phase_a_bookings") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: "b-1", status: "assigned", host_id: "host-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "analytics_events") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: async () => ({
                    data: [
                      {
                        created_at: departureTime,
                        metadata: { booking_id: "b-1", eta_minutes: 20 },
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return { select: () => ({}) };
      });

      const response = await GET(makeGetRequest("b-1"), {
        params: Promise.resolve({ id: "b-1" }),
      });
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.enRoute).toEqual({
        etaMinutes: 20,
        enRouteAt: departureTime,
      });
    });

    it("forbids a host trying to read another host's booking", async () => {
      mocks.requireActor.mockResolvedValueOnce({ userId: "other-host", role: "host" });
      mocks.db.from.mockImplementation((table: string) => {
        if (table === "phase_a_bookings") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: "b-1", status: "assigned", host_id: "host-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: () => ({}) };
      });

      const response = await GET(makeGetRequest("b-1"), {
        params: Promise.resolve({ id: "b-1" }),
      });
      expect(response.status).toBe(403);
    });
  });
});

