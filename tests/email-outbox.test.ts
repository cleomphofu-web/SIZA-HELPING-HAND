import { beforeEach, describe, expect, it, vi } from "vitest";
import { enqueueEmail, generateOutboxKey, processOutboxBatch } from "@/server/email/outbox";
import type { SupabaseClient } from "@supabase/supabase-js";

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mocks.send };
  },
}));

vi.mock("@/server/config/env", () => ({
  env: {
    RESEND_API_KEY: "re_test_key",
    RESEND_FROM_EMAIL: "notifications@siza.co.za",
  },
}));

vi.mock("server-only", () => ({}));

describe("Email Outbox Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateOutboxKey", () => {
    it("generates deterministic and unique idempotency keys", () => {
      const key1 = generateOutboxKey("host-booking-requested", "123e4567-e89b-12d3-a456-426614174000");
      const key2 = generateOutboxKey("host-booking-requested", "123e4567-e89b-12d3-a456-426614174000");
      const key3 = generateOutboxKey("host-booking-assigned", "123e4567-e89b-12d3-a456-426614174000");

      expect(key1).toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key1.startsWith("siza:host-booking-requested:")).toBe(true);
    });
  });

  describe("enqueueEmail", () => {
    it("inserts pending email row and returns true", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: "test-row-id" }, error: null }),
        }),
      });

      const fakeClient = {
        from: vi.fn().mockReturnValue({
          insert: mockInsert,
        }),
      } as unknown as SupabaseClient;

      const result = await enqueueEmail(fakeClient, {
        eventType: "helper-approved",
        recipient: "helper@example.test",
        entityId: "123e4567-e89b-12d3-a456-426614174000",
        variables: { firstName: "Themba" },
      });

      expect(result).toEqual({ enqueued: true, id: "test-row-id" });
      expect(fakeClient.from).toHaveBeenCalledWith("phase_a_email_outbox");
    });

    it("returns enqueued: false safely on unique conflict", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "23505", message: "duplicate key value" },
          }),
        }),
      });

      const fakeClient = {
        from: vi.fn().mockReturnValue({
          insert: mockInsert,
        }),
      } as unknown as SupabaseClient;

      const result = await enqueueEmail(fakeClient, {
        eventType: "helper-approved",
        recipient: "helper@example.test",
        entityId: "123e4567-e89b-12d3-a456-426614174000",
      });

      expect(result).toEqual({ enqueued: false });
    });

    it("rejects invalid recipient emails", async () => {
      const fakeClient = {} as unknown as SupabaseClient;

      await expect(
        enqueueEmail(fakeClient, {
          eventType: "helper-approved",
          recipient: "not-an-email",
          entityId: "123e4567-e89b-12d3-a456-426614174000",
        }),
      ).rejects.toThrow("Invalid recipient email address");
    });
  });

  describe("processOutboxBatch", () => {
    it("processes pending rows, calls Resend, and marks as sent", async () => {
      mocks.send.mockResolvedValue({ error: null });

      const mockRows = [
        {
          id: "row-1",
          event_type: "helper-approved",
          recipient: "helper@example.test",
          payload: { firstName: "Zola" },
          idempotency_key: "siza:helper-approved:hash",
          attempts: 0,
        },
      ];

      const updateEqMock = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: updateEqMock });

      const fakeClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "phase_a_email_outbox") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
                  }),
                }),
              }),
              update: mockUpdate,
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      const result = await processOutboxBatch(fakeClient, 10);

      expect(result).toEqual({ processed: 1, sent: 1, failed: 0 });
      expect(mocks.send).toHaveBeenCalledOnce();
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "sent",
          attempts: 1,
        }),
      );
    });

    it("records failure when provider returns error", async () => {
      mocks.send.mockResolvedValue({ error: { message: "Network timeout" } });

      const mockRows = [
        {
          id: "row-2",
          event_type: "admin-new-request",
          recipient: "admin@siza.co.za",
          payload: {},
          idempotency_key: "siza:admin-new-request:hash",
          attempts: 0,
        },
      ];

      const updateEqMock = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: updateEqMock });

      const fakeClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "phase_a_email_outbox") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
                  }),
                }),
              }),
              update: mockUpdate,
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      const result = await processOutboxBatch(fakeClient, 10);

      expect(result).toEqual({ processed: 1, sent: 0, failed: 1 });
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "pending",
          attempts: 1,
          last_error: "Network timeout",
        }),
      );
    });
  });
});
