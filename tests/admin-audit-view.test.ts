import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  order: vi.fn(),
  or: vi.fn(),
  limit: vi.fn(),
  rows: [] as unknown[],
  error: null as unknown,
  orderOfOperations: [] as string[],
}));

const query = {
  select: (...args: unknown[]) => { mocks.orderOfOperations.push("select"); return mocks.select(...args); },
  order: (...args: unknown[]) => { mocks.orderOfOperations.push("order"); return mocks.order(...args); },
  or: (...args: unknown[]) => { mocks.orderOfOperations.push("or"); return mocks.or(...args); },
  limit: (...args: unknown[]) => { mocks.orderOfOperations.push("limit"); return mocks.limit(...args); },
  then: (resolve: (result: { data: unknown[]; error: unknown }) => unknown) => Promise.resolve({ data: mocks.rows, error: mocks.error }).then(resolve),
};

vi.mock("server-only", () => ({}));
vi.mock("@/server/policies/auth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/server/db/admin", () => ({ createSupabaseAdminClient: () => ({ from: mocks.from }) }));

import { getAdminAuditEvents } from "@/server/views/admin-audit";

describe("admin audit read boundary", () => {
  beforeEach(() => {
    mocks.requireAdmin.mockReset().mockImplementation(async () => { mocks.orderOfOperations.push("authorize"); });
    mocks.from.mockReset().mockImplementation(() => { mocks.orderOfOperations.push("database"); return query; });
    mocks.select.mockReset().mockImplementation(() => query);
    mocks.order.mockReset().mockImplementation(() => query);
    mocks.or.mockReset().mockImplementation(() => query);
    mocks.limit.mockReset().mockImplementation(() => query);
    mocks.rows = [];
    mocks.error = null;
    mocks.orderOfOperations.length = 0;
  });

  it("authorizes before opening the service-role read and selects only the audit display fields", async () => {
    mocks.rows = [{ id: "00000000-0000-4000-8000-000000000001", action: "helper_approved", entity: "helper_details", at: "2026-10-26T08:00:00.000Z" }];
    const result = await getAdminAuditEvents();
    expect(mocks.orderOfOperations.slice(0, 2)).toEqual(["authorize", "database"]);
    expect(mocks.select).toHaveBeenCalledWith("id, action, entity, at");
    expect(mocks.limit).toHaveBeenCalledWith(51);
    expect(result).toEqual({ ok: true, data: { events: mocks.rows, hasMore: false, nextCursor: null } });
  });

  it("uses a validated composite cursor to keep equal-time events on the next page", async () => {
    const cursor = { at: "2026-10-26T08:00:00.000Z", id: "00000000-0000-4000-8000-000000000009" };
    const result = await getAdminAuditEvents(cursor);
    expect(result.ok).toBe(true);
    expect(mocks.or).toHaveBeenCalledWith("at.lt.2026-10-26T08:00:00.000Z,and(at.eq.2026-10-26T08:00:00.000Z,id.lt.00000000-0000-4000-8000-000000000009)");
  });

  it("returns fifty rows and a cursor without leaking actor or entity identifiers", async () => {
    mocks.rows = Array.from({ length: 51 }, (_, index) => ({
      id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      action: "helper_approved",
      entity: "helper_details",
      at: new Date(Date.UTC(2026, 9, 26, 8, 0, index)).toISOString(),
      actor_id: "private-actor",
      entity_id: "private-entity",
    }));
    const result = await getAdminAuditEvents();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.events).toHaveLength(50);
    expect(result.data.hasMore).toBe(true);
    expect(result.data.nextCursor).toEqual({ at: result.data.events[49].at, id: result.data.events[49].id });
    expect(JSON.stringify(result.data)).not.toContain("private-");
    expect(mocks.order.mock.calls).toEqual([["at", { ascending: false }], ["id", { ascending: false }]]);
  });

  it("rejects partial and malformed cursors without querying the audit table", async () => {
    const partial = await getAdminAuditEvents({ at: "2026-10-26T08:00:00.000Z" });
    const malformed = await getAdminAuditEvents({ at: "latest", id: "not-a-uuid" });
    expect(partial).toMatchObject({ ok: false, error: { code: "validation_failed" } });
    expect(malformed).toMatchObject({ ok: false, error: { code: "validation_failed" } });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("converts database errors to a safe internal result", async () => {
    mocks.error = new Error("private database detail");
    const result = await getAdminAuditEvents();
    expect(result).toMatchObject({ ok: false, error: { code: "internal_error" } });
    expect(JSON.stringify(result)).not.toContain("private database detail");
  });

  it("does not query when admin authorization redirects", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(getAdminAuditEvents()).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
