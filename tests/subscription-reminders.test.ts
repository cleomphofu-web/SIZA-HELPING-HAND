import { beforeEach, describe, expect, it, vi } from "vitest";
import { enqueueSubscriptionReminders } from "@/server/services/retention";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("server-only", () => ({}));
vi.mock("@/server/email/outbox", () => ({
  enqueueEmail: vi.fn().mockResolvedValue({ enqueued: true, id: "outbox-1" }),
}));
vi.mock("@/server/services/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue({ ok: true, data: { id: "notif-1" } }),
}));

describe("enqueueSubscriptionReminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns zero counts if client.from is not a function", async () => {
    const fakeClient = {} as unknown as SupabaseClient;
    const result = await enqueueSubscriptionReminders(fakeClient);
    expect(result).toEqual({ reminded: 0, failed: 0 });
  });

  it("handles empty list of lapsing helpers", async () => {
    const fakeClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    } as unknown as SupabaseClient;

    const result = await enqueueSubscriptionReminders(fakeClient);
    expect(result).toEqual({ reminded: 0, failed: 0 });
  });

  it("enqueues plan reminders for helpers whose subscription is ending", async () => {
    const mockHelpers = [
      { user_id: "00000000-0000-4000-8000-000000000001", subscription_paid_until: "2026-11-10T12:00:00Z" },
    ];

    const mockProfile = { first_name: "Themba", phone: "+27821234567" };

    const fakeClient = {
      auth: {
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { email: "themba@example.test" } },
          }),
        },
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "helper_details") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            not: vi.fn().mockReturnThis(),
            gt: vi.fn().mockReturnThis(),
            lte: vi.fn().mockResolvedValue({ data: mockHelpers, error: null }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
          };
        }
        if (table === "phase_a_email_outbox") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: "outbox-1" }, error: null }),
              }),
            }),
          };
        }
        if (table === "in_app_notifications") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "notif-1" }, error: null }),
              }),
            }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;

    const now = new Date("2026-11-06T00:00:00Z");
    const result = await enqueueSubscriptionReminders(fakeClient, now, 7);
    expect(result.reminded).toBe(1);
    expect(result.failed).toBe(0);
  });
});
