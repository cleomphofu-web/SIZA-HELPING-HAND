import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// ── Mock Supabase admin client ───────────────────────────────────────────────

type MockQueryChain = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
};

let mockChain: MockQueryChain;
let mockFrom: ReturnType<typeof vi.fn>;

vi.mock("@/server/db/admin", () => ({
  createSupabaseAdminClient: () => ({ from: mockFrom }),
}));

vi.mock("@/server/policies/auth", () => ({
  requireActor: vi.fn(),
}));

vi.mock("@/server/services/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue({ ok: true, data: { id: "notif-1" } }),
}));

import { requireActor } from "@/server/policies/auth";
import {
  getBookingMessages,
  postBookingMessage,
} from "@/server/services/booking-messages";

// ── Shared test data ─────────────────────────────────────────────────────────

const BOOKING_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const HOST_ID = "hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh";
const HELPER_ID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";

const hostActor = { id: HOST_ID, userId: HOST_ID, role: "host" as const };
const helperActor = { id: HELPER_ID, userId: HELPER_ID, role: "helper" as const };

const mockBookingRow = { id: BOOKING_ID, host_id: HOST_ID };
const mockAcceptedAssignment = { helper_id: HELPER_ID };

const sampleMessageRow = {
  id: "msg-1",
  booking_id: BOOKING_ID,
  sender_id: HOST_ID,
  sender_role: "host",
  sender_first_name: "Thandi",
  message: "Gate code is #4921",
  created_at: "2026-11-06T07:00:00Z",
};

// ── Build a fresh chainable mock before every test ───────────────────────────

function makeChain(overrides: Partial<MockQueryChain> = {}): MockQueryChain {
  const chain: MockQueryChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── getBookingMessages ────────────────────────────────────────────────────────

describe("getBookingMessages", () => {
  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireActor).mockRejectedValue(new Error("unauthenticated"));

    const result = await getBookingMessages(BOOKING_ID);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("unauthenticated");
  });

  it("returns 404 when booking does not exist", async () => {
    vi.mocked(requireActor).mockResolvedValue(hostActor);

    mockChain = makeChain({
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    mockFrom = vi.fn(() => mockChain);

    const result = await getBookingMessages(BOOKING_ID);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("not_found");
  });

  it("returns 403 when host does not own the booking", async () => {
    vi.mocked(requireActor).mockResolvedValue(hostActor);

    let callIndex = 0;
    mockFrom = vi.fn(() => {
      callIndex += 1;
      if (callIndex === 1) {
        // phase_a_bookings query — returns booking owned by a different host
        return makeChain({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: BOOKING_ID, host_id: "other-host-id" },
            error: null,
          }),
        });
      }
      return makeChain();
    });

    const result = await getBookingMessages(BOOKING_ID);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("forbidden");
  });

  it("returns empty array when host owns booking but no messages yet", async () => {
    vi.mocked(requireActor).mockResolvedValue(hostActor);

    let callIndex = 0;
    mockFrom = vi.fn(() => {
      callIndex += 1;
      if (callIndex === 1) {
        // phase_a_bookings
        return makeChain({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockBookingRow, error: null }),
        });
      }
      if (callIndex === 2) {
        // booking_assignments (helper list for host)
        return makeChain({
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        });
      }
      // booking_messages
      return makeChain({
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      });
    });

    const result = await getBookingMessages(BOOKING_ID);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual([]);
  });

  it("returns messages for host-owned booking", async () => {
    vi.mocked(requireActor).mockResolvedValue(hostActor);

    let callIndex = 0;
    mockFrom = vi.fn(() => {
      callIndex += 1;
      if (callIndex === 1) {
        return makeChain({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockBookingRow, error: null }),
        });
      }
      if (callIndex === 2) {
        return makeChain({
          in: vi.fn().mockResolvedValue({ data: [mockAcceptedAssignment], error: null }),
        });
      }
      return makeChain({
        limit: vi.fn().mockResolvedValue({ data: [sampleMessageRow], error: null }),
      });
    });

    const result = await getBookingMessages(BOOKING_ID);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toHaveLength(1);
    expect(result.data[0].message).toBe("Gate code is #4921");
    expect(result.data[0].senderRole).toBe("host");
  });

  it("returns 403 when helper has no assignment on booking", async () => {
    vi.mocked(requireActor).mockResolvedValue(helperActor);

    let callIndex = 0;
    mockFrom = vi.fn(() => {
      callIndex += 1;
      if (callIndex === 1) {
        return makeChain({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockBookingRow, error: null }),
        });
      }
      // booking_assignments — no assignment found
      return makeChain({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      });
    });

    const result = await getBookingMessages(BOOKING_ID);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("forbidden");
  });

  it("returns messages for assigned helper", async () => {
    vi.mocked(requireActor).mockResolvedValue(helperActor);

    let callIndex = 0;
    mockFrom = vi.fn(() => {
      callIndex += 1;
      if (callIndex === 1) {
        // phase_a_bookings
        return makeChain({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockBookingRow, error: null }),
        });
      }
      if (callIndex === 2) {
        // first booking_assignments check (maybeSingle — has assignment)
        return makeChain({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockAcceptedAssignment, error: null }),
        });
      }
      if (callIndex === 3) {
        // all assignments for sibling helper IDs
        return makeChain({
          in: vi.fn().mockResolvedValue({ data: [mockAcceptedAssignment], error: null }),
        });
      }
      // booking_messages
      return makeChain({
        limit: vi.fn().mockResolvedValue({ data: [sampleMessageRow], error: null }),
      });
    });

    const result = await getBookingMessages(BOOKING_ID);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toHaveLength(1);
  });
});

// ── postBookingMessage ────────────────────────────────────────────────────────

describe("postBookingMessage", () => {
  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireActor).mockRejectedValue(new Error("unauthenticated"));

    const result = await postBookingMessage(BOOKING_ID, "Hello");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("unauthenticated");
  });

  it("rejects empty message", async () => {
    vi.mocked(requireActor).mockResolvedValue(hostActor);

    const result = await postBookingMessage(BOOKING_ID, "   ");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("validation_failed");
  });

  it("rejects message over 1000 chars", async () => {
    vi.mocked(requireActor).mockResolvedValue(hostActor);

    const result = await postBookingMessage(BOOKING_ID, "x".repeat(1001));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("validation_failed");
  });

  it("allows message of exactly 1000 chars", async () => {
    vi.mocked(requireActor).mockResolvedValue(hostActor);

    let callIndex = 0;
    const newMessageRow = {
      ...sampleMessageRow,
      sender_id: HOST_ID,
      message: "x".repeat(1000),
    };

    mockFrom = vi.fn(() => {
      callIndex += 1;
      if (callIndex === 1) {
        return makeChain({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockBookingRow, error: null }),
        });
      }
      if (callIndex === 2) {
        return makeChain({
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        });
      }
      if (callIndex === 3) {
        // profiles — sender name
        return makeChain({
          maybeSingle: vi.fn().mockResolvedValue({ data: { first_name: "Thandi" }, error: null }),
        });
      }
      // insert
      return makeChain({
        single: vi.fn().mockResolvedValue({ data: newMessageRow, error: null }),
      });
    });

    const result = await postBookingMessage(BOOKING_ID, "x".repeat(1000));

    expect(result.ok).toBe(true);
  });

  it("creates a message and returns it for the host", async () => {
    vi.mocked(requireActor).mockResolvedValue(hostActor);

    const newMessageRow = {
      ...sampleMessageRow,
      sender_id: HOST_ID,
      message: "Gate code is #4921",
    };

    let callIndex = 0;
    mockFrom = vi.fn(() => {
      callIndex += 1;
      if (callIndex === 1) {
        return makeChain({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockBookingRow, error: null }),
        });
      }
      if (callIndex === 2) {
        // booking_assignments for host (helper list)
        return makeChain({
          in: vi.fn().mockResolvedValue({ data: [mockAcceptedAssignment], error: null }),
        });
      }
      if (callIndex === 3) {
        // profiles
        return makeChain({
          maybeSingle: vi.fn().mockResolvedValue({ data: { first_name: "Thandi" }, error: null }),
        });
      }
      // booking_messages insert
      return makeChain({
        single: vi.fn().mockResolvedValue({ data: newMessageRow, error: null }),
      });
    });

    const result = await postBookingMessage(BOOKING_ID, "Gate code is #4921");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.message).toBe("Gate code is #4921");
    expect(result.data.senderRole).toBe("host");
    expect(result.data.senderFirstName).toBe("Thandi");
  });

  it("creates a message for an assigned helper", async () => {
    vi.mocked(requireActor).mockResolvedValue(helperActor);

    const newMessageRow = {
      ...sampleMessageRow,
      sender_id: HELPER_ID,
      sender_role: "helper",
      message: "I am at the gate",
    };

    let callIndex = 0;
    mockFrom = vi.fn(() => {
      callIndex += 1;
      if (callIndex === 1) {
        return makeChain({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockBookingRow, error: null }),
        });
      }
      if (callIndex === 2) {
        // first assignment check
        return makeChain({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockAcceptedAssignment, error: null }),
        });
      }
      if (callIndex === 3) {
        // all sibling assignments
        return makeChain({
          in: vi.fn().mockResolvedValue({ data: [mockAcceptedAssignment], error: null }),
        });
      }
      if (callIndex === 4) {
        // profiles
        return makeChain({
          maybeSingle: vi.fn().mockResolvedValue({ data: { first_name: "Sipho" }, error: null }),
        });
      }
      // insert
      return makeChain({
        single: vi.fn().mockResolvedValue({ data: newMessageRow, error: null }),
      });
    });

    const result = await postBookingMessage(BOOKING_ID, "I am at the gate");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.message).toBe("I am at the gate");
    expect(result.data.senderRole).toBe("helper");
  });

  it("returns internal_error when insert fails", async () => {
    vi.mocked(requireActor).mockResolvedValue(hostActor);

    let callIndex = 0;
    mockFrom = vi.fn(() => {
      callIndex += 1;
      if (callIndex === 1) {
        return makeChain({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockBookingRow, error: null }),
        });
      }
      if (callIndex === 2) {
        return makeChain({
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        });
      }
      if (callIndex === 3) {
        return makeChain({
          maybeSingle: vi.fn().mockResolvedValue({ data: { first_name: "Thandi" }, error: null }),
        });
      }
      // insert fails
      return makeChain({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
      });
    });

    const result = await postBookingMessage(BOOKING_ID, "Please ring bell");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("internal_error");
  });
});

