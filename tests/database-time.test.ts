import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getDatabaseNow } from "@/server/views/database-time";

describe("database-authoritative time", () => {
  it("uses the timestamp returned by Postgres", async () => {
    const client = { rpc: vi.fn().mockResolvedValue({ data: "2026-10-26T12:00:00.000Z", error: null }) };

    await expect(getDatabaseNow(client)).resolves.toEqual(new Date("2026-10-26T12:00:00.000Z"));
    expect(client.rpc).toHaveBeenCalledWith("get_phase_a_database_now");
  });

  it("fails closed when the database clock cannot be read", async () => {
    const client = { rpc: vi.fn().mockResolvedValue({ data: null, error: new Error("unavailable") }) };
    await expect(getDatabaseNow(client)).resolves.toBeNull();
  });

  it("rejects malformed database timestamps", async () => {
    const client = { rpc: vi.fn().mockResolvedValue({ data: "not-a-timestamp", error: null }) };
    await expect(getDatabaseNow(client)).resolves.toBeNull();
  });
});
