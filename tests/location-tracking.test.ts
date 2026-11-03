import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  recordLocationPing,
  getLatestLocation,
  generateWhatsAppEtaLink,
} from "@/server/services/location-tracking";

describe("Location Tracking Service", () => {
  function makeTrackingMockDb(options: {
    isAssigned?: boolean;
    existingPing?: { lat: number; lng: number; accuracy_m: number; created_at: string } | null;
  }) {
    const insertedPings: Array<Record<string, unknown>> = [];

    return {
      from: (table: string) => {
        if (table === "booking_assignments") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: options.isAssigned !== false ? { id: "assignment-1", status: "accepted" } : null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        if (table === "location_pings") {
          return {
            insert: (data: Record<string, unknown>) => {
              insertedPings.push(data);
              return {
                select: () => ({
                  single: async () => ({
                    data: { id: "ping-uuid-123", ...data },
                    error: null,
                  }),
                }),
              };
            },
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({
                      data: options.existingPing ?? null,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      },
      _insertedPings: insertedPings,
    };
  }

  describe("recordLocationPing", () => {
    it("successfully records valid GPS coordinates for assigned helper", async () => {
      const db = makeTrackingMockDb({ isAssigned: true });
      const result = await recordLocationPing(db, {
        bookingId: "booking-123",
        helperId: "helper-456",
        lat: -26.2041, // Johannesburg latitude
        lng: 28.0473,  // Johannesburg longitude
        accuracyM: 10.5,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.pingId).toBe("ping-uuid-123");
      }
      expect(db._insertedPings).toHaveLength(1);
      expect(db._insertedPings[0]?.lat).toBe(-26.2041);
      expect(db._insertedPings[0]?.lng).toBe(28.0473);
    });

    it("rejects latitude outside -90 to 90 degrees", async () => {
      const db = makeTrackingMockDb({});
      const result = await recordLocationPing(db, {
        bookingId: "booking-123",
        helperId: "helper-456",
        lat: -95.0,
        lng: 28.0473,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("validation_failed");
        expect(result.error.message).toContain("Latitude");
      }
    });

    it("rejects longitude outside -180 to 180 degrees", async () => {
      const db = makeTrackingMockDb({});
      const result = await recordLocationPing(db, {
        bookingId: "booking-123",
        helperId: "helper-456",
        lat: -26.2041,
        lng: 195.0,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("validation_failed");
        expect(result.error.message).toContain("Longitude");
      }
    });

    it("rejects location ping if helper is not assigned to booking", async () => {
      const db = makeTrackingMockDb({ isAssigned: false });
      const result = await recordLocationPing(db, {
        bookingId: "booking-123",
        helperId: "unassigned-helper",
        lat: -26.2041,
        lng: 28.0473,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("forbidden");
        expect(result.error.message).toContain("not assigned");
      }
    });
  });

  describe("getLatestLocation", () => {
    it("returns null when no location pings exist", async () => {
      const db = makeTrackingMockDb({ existingPing: null });
      const result = await getLatestLocation(db, "booking-123");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBeNull();
      }
    });

    it("returns formatted latest ping data when available", async () => {
      const db = makeTrackingMockDb({
        existingPing: {
          lat: -26.2041,
          lng: 28.0473,
          accuracy_m: 8.0,
          created_at: "2026-11-03T18:00:00.000Z",
        },
      });

      const result = await getLatestLocation(db, "booking-123");
      expect(result.ok).toBe(true);
      if (result.ok && result.data) {
        expect(result.data.lat).toBe(-26.2041);
        expect(result.data.lng).toBe(28.0473);
        expect(result.data.accuracyM).toBe(8.0);
        expect(result.data.recordedAt).toBe("2026-11-03T18:00:00.000Z");
      }
    });
  });

  describe("generateWhatsAppEtaLink", () => {
    it("generates valid wa.me URL with encoded ETA message and siZa branding", () => {
      const link = generateWhatsAppEtaLink({
        hostPhone: "+27821234567",
        helperFirstName: "Nomsa",
        etaMinutes: 20,
      });

      expect(link).toContain("https://wa.me/27821234567?text=");
      expect(link).toContain("Nomsa");
      expect(link).toContain("20%20minutes");
      expect(link).toContain("siZa");
    });
  });
});
