import { describe, it, expect } from "vitest";
import { vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createSupportTicket,
  listUserTickets,
  resolveSupportTicket,
} from "@/server/services/support";
import {
  sanitizeAnalyticsMetadata,
  trackEvent,
  getEventCounts,
} from "@/server/services/analytics";

describe("Support and Analytics Services", () => {
  describe("Support Tickets", () => {
    function makeSupportMockDb() {
      const tickets: Array<Record<string, unknown>> = [];
      return {
        from: (table: string) => {
          if (table === "support_tickets") {
            return {
              insert: (data: Record<string, unknown>) => {
                const row = { id: "ticket-123", ...data, created_at: new Date().toISOString() };
                tickets.push(row);
                return {
                  select: () => ({
                    single: async () => ({ data: row, error: null }),
                  }),
                };
              },
              select: () => ({
                eq: () => ({
                  order: async () => ({ data: tickets, error: null }),
                }),
              }),
              update: (data: Record<string, unknown>) => {
                if (tickets[0]) Object.assign(tickets[0], data);
                return {
                  eq: async () => ({ error: null }),
                };
              },
            };
          }
          throw new Error(`Unexpected table: ${table}`);
        },
        _tickets: tickets,
      };
    }

    it("creates support ticket with valid subject and message", async () => {
      const db = makeSupportMockDb();
      const result = await createSupportTicket(db, {
        userId: "user-1",
        category: "booking",
        subject: "Need help with arrival time",
        message: "Can I adjust the arrival window by 30 minutes?",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.ticketId).toBe("ticket-123");
      }
    });

    it("rejects ticket with subject under 5 characters", async () => {
      const db = makeSupportMockDb();
      const result = await createSupportTicket(db, {
        userId: "user-1",
        category: "payment",
        subject: "Help",
        message: "Long enough message for support",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("validation_failed");
      }
    });

    it("lists user tickets and resolves ticket", async () => {
      const db = makeSupportMockDb();
      await createSupportTicket(db, {
        userId: "user-1",
        category: "account",
        subject: "Update phone number query",
        message: "How do I change my primary phone number?",
      });

      const listResult = await listUserTickets(db, "user-1");
      expect(listResult.ok).toBe(true);
      if (listResult.ok) {
        expect(listResult.data).toHaveLength(1);
        expect(listResult.data[0]?.status).toBe("open");
      }

      const resolveResult = await resolveSupportTicket(db, {
        ticketId: "ticket-123",
        status: "resolved",
        adminNote: "Phone number updated upon identity verification.",
      });
      expect(resolveResult.ok).toBe(true);
    });
  });

  describe("In-House Analytics", () => {
    it("scrubs sensitive keys (PII, credentials) from event metadata", () => {
      const rawMetadata = {
        suburb: "Rosebank",
        servicesCount: 2,
        password: "SuperSecretPassword123!",
        idNumber: "9001015800088",
        cvv: "123",
        amountCents: 36000,
      };

      const safe = sanitizeAnalyticsMetadata(rawMetadata);
      expect(safe.suburb).toBe("Rosebank");
      expect(safe.servicesCount).toBe(2);
      expect(safe.amountCents).toBe(36000);

      // Sensitive fields must be stripped completely
      expect(safe.password).toBeUndefined();
      expect(safe.idNumber).toBeUndefined();
      expect(safe.cvv).toBeUndefined();
    });

    it("tracks analytics event in database", async () => {
      const trackedEvents: Array<Record<string, unknown>> = [];
      const db = {
        from: (table: string) => {
          if (table === "analytics_events") {
            return {
              insert: (data: Record<string, unknown>) => {
                trackedEvents.push(data);
                return {
                  select: () => ({
                    single: async () => ({ data: { id: "event-uuid-1", ...data }, error: null }),
                  }),
                };
              },
            };
          }
          throw new Error(`Unexpected table: ${table}`);
        },
      };

      const result = await trackEvent(db, {
        eventName: "payment_completed",
        userId: "host-1",
        userRole: "host",
        metadata: { bookingId: "booking-101", amountCents: 36000 },
      });

      expect(result.ok).toBe(true);
      expect(trackedEvents).toHaveLength(1);
      expect(trackedEvents[0]?.event_name).toBe("payment_completed");
    });

    it("aggregates event counts since timestamp", async () => {
      const db = {
        from: (_table: string) => ({
          select: () => ({
            gte: async () => ({
              data: [
                { event_name: "booking_created" },
                { event_name: "booking_created" },
                { event_name: "payment_completed" },
              ],
              error: null,
            }),
          }),
        }),
      };

      const result = await getEventCounts(db, new Date("2026-11-01"));
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data["booking_created"]).toBe(2);
        expect(result.data["payment_completed"]).toBe(1);
      }
    });
  });
});
