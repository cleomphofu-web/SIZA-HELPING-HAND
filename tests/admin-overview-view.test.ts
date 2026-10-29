import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  createClient: vi.fn(),
  query: [] as Array<{ table: string; filters: Array<[string, string]>; selected?: [string, unknown] }>,
  counts: new Map<string, number | null>(),
  errorTable: "" as string,
  operations: [] as string[],
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/policies/auth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/server/db/admin", () => ({ createSupabaseAdminClient: mocks.createClient }));

import { getAdminOverview } from "@/server/views/admin-overview";

describe("admin overview read boundary", () => {
  beforeEach(() => {
    mocks.requireAdmin.mockReset().mockImplementation(async () => { mocks.operations.push("authorize"); });
    mocks.query = [];
    mocks.counts = new Map([
      ["profiles:role=host&deleted_at=is.null", 12],
      ["helper_details:status=pending", 3],
      ["helper_details:status=approved", 8],
      ["helper_details:status=declined", 2],
      ["helper_details:status=suspended", 1],
      ["phase_a_bookings:status=open", 4],
      ["phase_a_bookings:status=assigned", 5],
      ["phase_a_bookings:status=in_progress", 2],
      ["phase_a_bookings:status=completed", 24],
      ["phase_a_reports:status=open", 1],
      ["phase_a_reports:status=reviewing", 2],
    ]);
    mocks.errorTable = "";
    mocks.operations.length = 0;
    mocks.createClient.mockReset().mockImplementation(() => {
      mocks.operations.push("create_service_client");
      return {
        from(table: string) {
          const call = { table, filters: [] as Array<[string, string]>, selected: undefined as [string, unknown] | undefined };
          mocks.query.push(call);
          const builder = {
            select(columns: string, options: unknown) { call.selected = [columns, options]; return builder; },
            eq(column: string, value: string) { call.filters.push([column, value]); return builder; },
            is(column: string, value: null) { void value; call.filters.push([column, "is.null"]); return builder; },
            then(resolve: (_result: { count: number | null; error: Error | null }) => unknown) {
              const key = `${table}:${call.filters.map(([column, value]) => `${column}=${value}`).join("&")}`;
              return Promise.resolve({ count: mocks.counts.get(key) ?? null, error: mocks.errorTable === table ? new Error("database detail") : null }).then(resolve);
            },
          };
          return builder;
        },
      };
    });
  });

  it("checks admin membership before querying and returns aggregate counts only", async () => {
    const result = await getAdminOverview();
    expect(mocks.operations.slice(0, 2)).toEqual(["authorize", "create_service_client"]);
    expect(result).toEqual({ ok: true, data: {
      hosts: 12,
      helpers: { pending: 3, approved: 8, declined: 2, suspended: 1 },
      bookings: { open: 4, assigned: 5, inProgress: 2, completed: 24 },
      reportsToReview: 3,
    } });
    expect(mocks.query).toHaveLength(11);
    expect(mocks.query.every((query) => ["id", "user_id"].includes(query.selected?.[0] ?? "") && (query.selected?.[1] as { count?: string; head?: boolean } | undefined)?.count === "exact" && (query.selected?.[1] as { head?: boolean } | undefined)?.head === true)).toBe(true);
    expect(mocks.query.flatMap((query) => query.selected?.[0] ?? "").join(",")).not.toMatch(/name|email|phone|address|text|actor_id|entity_id/);
  });

  it("reports a count query failure instead of displaying a false zero", async () => {
    mocks.errorTable = "phase_a_reports";
    const result = await getAdminOverview();
    expect(result).toMatchObject({ ok: false, error: { code: "internal_error" } });
    expect(JSON.stringify(result)).not.toContain("database detail");
  });

  it("does not open the service-role client if admin authorization fails", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(getAdminOverview()).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.query).toHaveLength(0);
  });
});
