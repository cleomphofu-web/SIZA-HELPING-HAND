import { describe, expect, it, vi } from "vitest";
import {
  expireOpenBookings,
  lapseExpiredSubscriptions,
  pruneExpiredBookingOffers,
  autoReleaseBookings,
} from "@/server/services/retention";
import type { SupabaseClient } from "@supabase/supabase-js";

function makeRpcClient(result: { data: unknown; error: unknown }) {
  return {
    rpc: vi.fn().mockResolvedValue(result),
  } as unknown as SupabaseClient;
}

describe("expireOpenBookings", () => {
  it("returns the count returned by the RPC", async () => {
    const client = makeRpcClient({ data: 3, error: null });
    expect(await expireOpenBookings(client)).toBe(3);
  });

  it("calls expire_open_bookings RPC with current time", async () => {
    const client = makeRpcClient({ data: 0, error: null });
    const now = new Date("2026-11-01T10:00:00Z");
    await expireOpenBookings(client, now);
    expect((client.rpc as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      "expire_open_bookings",
      { p_now: now.toISOString() },
    );
  });

  it("throws if RPC returns an error", async () => {
    const client = makeRpcClient({ data: null, error: { message: "fail" } });
    await expect(expireOpenBookings(client)).rejects.toThrow("Could not expire open bookings.");
  });

  it("returns 0 when data is null but no error (idempotent)", async () => {
    const client = makeRpcClient({ data: null, error: null });
    expect(await expireOpenBookings(client)).toBe(0);
  });
});

describe("lapseExpiredSubscriptions", () => {
  it("returns the count returned by the RPC", async () => {
    const client = makeRpcClient({ data: 5, error: null });
    expect(await lapseExpiredSubscriptions(client)).toBe(5);
  });

  it("calls lapse_expired_subscriptions RPC with correct time", async () => {
    const client = makeRpcClient({ data: 0, error: null });
    const now = new Date("2026-12-01T00:00:00Z");
    await lapseExpiredSubscriptions(client, now);
    expect((client.rpc as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      "lapse_expired_subscriptions",
      { p_now: now.toISOString() },
    );
  });

  it("throws if RPC returns an error", async () => {
    const client = makeRpcClient({ data: null, error: { message: "db error" } });
    await expect(lapseExpiredSubscriptions(client)).rejects.toThrow("Could not lapse expired subscriptions.");
  });
});

describe("pruneExpiredBookingOffers", () => {
  it("returns the count returned by the RPC", async () => {
    const client = makeRpcClient({ data: 12, error: null });
    expect(await pruneExpiredBookingOffers(client)).toBe(12);
  });

  it("throws for invalid batch size (too large)", async () => {
    const client = makeRpcClient({ data: 0, error: null });
    await expect(pruneExpiredBookingOffers(client, new Date(), 9999)).rejects.toThrow("Invalid offer-prune batch size.");
  });

  it("throws for invalid batch size (zero)", async () => {
    const client = makeRpcClient({ data: 0, error: null });
    await expect(pruneExpiredBookingOffers(client, new Date(), 0)).rejects.toThrow("Invalid offer-prune batch size.");
  });

  it("throws if RPC returns an error", async () => {
    const client = makeRpcClient({ data: null, error: { message: "fail" } });
    await expect(pruneExpiredBookingOffers(client)).rejects.toThrow("Could not prune expired booking offers.");
  });
});

describe("autoReleaseBookings", () => {
  it("returns the count returned by the RPC", async () => {
    const client = makeRpcClient({ data: 2, error: null });
    expect(await autoReleaseBookings(client)).toBe(2);
  });

  it("throws if RPC returns an error", async () => {
    const client = makeRpcClient({ data: null, error: { message: "err" } });
    await expect(autoReleaseBookings(client)).rejects.toThrow("Could not auto-release bookings.");
  });
});

