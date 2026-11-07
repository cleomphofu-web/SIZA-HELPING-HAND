import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// ── Mock Supabase admin client ───────────────────────────────────────────────

type MockQueryChain = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};

let mockChain: MockQueryChain;
let mockFrom: ReturnType<typeof vi.fn>;

vi.mock("@/server/db/admin", () => ({
  createSupabaseAdminClient: () => ({ from: mockFrom }),
}));

vi.mock("@/server/policies/auth", () => ({
  requireActor: vi.fn(),
}));

import { requireActor } from "@/server/policies/auth";
import {
  getNotifications,
  markAllNotificationsRead,
  createNotification,
} from "@/server/services/notifications";

const mockActor = { id: "user-abc", userId: "user-abc", role: "host" as const };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireActor).mockResolvedValue(mockActor);

  mockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  mockFrom = vi.fn(() => mockChain);
});

// ── getNotifications ─────────────────────────────────────────────────────────

describe("getNotifications", () => {
  it("returns empty inbox when user has no notifications", async () => {
    mockChain.limit.mockResolvedValue({ data: [], error: null });

    const result = await getNotifications();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.notifications).toEqual([]);
    expect(result.data.unreadCount).toBe(0);
  });

  it("counts only unread notifications", async () => {
    mockChain.limit.mockResolvedValue({
      data: [
        { id: "n1", kind: "job_offer", title: "New job!", body: "Rosebank", action_path: "/helper/jobs/1", reference_id: null, read_at: null, created_at: "2026-11-06T00:00:00Z" },
        { id: "n2", kind: "booking_confirmed", title: "Booked", body: "Thandi accepted", action_path: null, reference_id: "b1", read_at: "2026-11-05T23:00:00Z", created_at: "2026-11-05T22:00:00Z" },
      ],
      error: null,
    });

    const result = await getNotifications();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.notifications).toHaveLength(2);
    expect(result.data.unreadCount).toBe(1);
    expect(result.data.notifications[0]?.readAt).toBeNull();
    expect(result.data.notifications[1]?.readAt).not.toBeNull();
  });

  it("fails with unauthenticated when no actor", async () => {
    vi.mocked(requireActor).mockRejectedValue(new Error("unauthenticated"));
    const result = await getNotifications();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("unauthenticated");
  });

  it("fails with internal_error on DB error", async () => {
    mockChain.limit.mockResolvedValue({ data: null, error: new Error("db down") });
    const result = await getNotifications();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("internal_error");
  });
});

// ── markAllNotificationsRead ─────────────────────────────────────────────────

describe("markAllNotificationsRead", () => {
  it("marks unread notifications and returns count", async () => {
    mockChain.is.mockReturnThis();
    // After is(), select() is called and resolves
    const selectAfterIs = vi.fn().mockResolvedValue({
      data: [{ id: "n1" }, { id: "n2" }],
      error: null,
    });
    mockChain.is = vi.fn().mockReturnValue({ select: selectAfterIs });

    const result = await markAllNotificationsRead();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.markedCount).toBe(2);
  });

  it("returns 0 when nothing is unread", async () => {
    const selectAfterIs = vi.fn().mockResolvedValue({ data: [], error: null });
    mockChain.is = vi.fn().mockReturnValue({ select: selectAfterIs });

    const result = await markAllNotificationsRead();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.markedCount).toBe(0);
  });

  it("fails unauthenticated when no actor", async () => {
    vi.mocked(requireActor).mockRejectedValue(new Error("unauthenticated"));
    const result = await markAllNotificationsRead();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("unauthenticated");
  });
});

// ── createNotification ───────────────────────────────────────────────────────

describe("createNotification", () => {
  it("inserts a notification and returns its id", async () => {
    mockChain.single.mockResolvedValue({ data: { id: "notif-xyz" }, error: null });

    const result = await createNotification({
      userId: "user-abc",
      kind: "job_offer",
      title: "New job available",
      body: "Rosebank · Tomorrow 9am · R290",
      actionPath: "/helper/jobs/123",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.id).toBe("notif-xyz");
    // Verify insert was called with the right table
    expect(mockFrom).toHaveBeenCalledWith("in_app_notifications");
    expect(mockChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-abc", kind: "job_offer" })
    );
  });

  it("fails with internal_error on DB error", async () => {
    mockChain.single.mockResolvedValue({ data: null, error: new Error("constraint") });
    const result = await createNotification({
      userId: "user-abc",
      kind: "booking_confirmed",
      title: "Booking confirmed",
      body: "Helper accepted your request.",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("internal_error");
  });
});

