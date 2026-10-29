import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/config/env", () => ({ env: { ID_ENCRYPTION_KEY: "synthetic-key" } }));

import { issuePhaseACheckInCode } from "@/server/services/phase-a";

function makeClient() {
  const updateValues: Array<Record<string, unknown>> = [];
  const filters: Array<[string, unknown]> = [];
  let bookingRead = false;
  const from = vi.fn((table: string) => {
    if (table === "app_config") return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { value: 12 }, error: null }) }) }) };
    if (table === "phase_a_bookings") return {
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => {
              bookingRead = true;
              return { data: { id: "booking-1", end_at_est: "2026-10-26T10:00:00.000Z", status: "assigned" }, error: null };
            },
          }),
        }),
      }),
      update: (values: Record<string, unknown>) => {
        updateValues.push(values);
        const query = {
          eq: (column: string, value: unknown) => { filters.push([column, value]); return query; },
          select: () => ({ maybeSingle: async () => ({ data: bookingRead ? { id: "booking-1" } : null, error: null }) }),
          then: (resolve: (value: { error: null }) => unknown) => Promise.resolve({ error: null }).then(resolve),
        };
        return query;
      },
    };
    throw new Error(`Unexpected service table ${table}`);
  });
  return { client: { from }, from, updateValues, filters };
}

describe("host check-in code issuance", () => {
  it("cannot reset the wrong-attempt counter or lock when issuing a replacement code", async () => {
    const { client, updateValues, filters } = makeClient();
    const result = await issuePhaseACheckInCode(client as never, "host-1", { bookingId: "booking-1" });
    expect(result.ok).toBe(true);
    expect(updateValues[0]).not.toHaveProperty("code_attempts");
    expect(updateValues[0]).not.toHaveProperty("code_locked_until");
    expect(filters).toContainEqual(["status", "assigned"]);
  });
});
