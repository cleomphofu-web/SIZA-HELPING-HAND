import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  rows: [] as unknown[],
  error: null as unknown,
  orderOfOperations: [] as string[],
}));

const query = {
  select: (...args: unknown[]) => {
    mocks.orderOfOperations.push("select");
    return mocks.select(...args);
  },
  order: (...args: unknown[]) => {
    mocks.orderOfOperations.push("order");
    return mocks.order(...args);
  },
  limit: (...args: unknown[]) => {
    mocks.orderOfOperations.push("limit");
    return mocks.limit(...args);
  },
  then: (resolve: (result: { data: unknown[]; error: unknown }) => unknown) =>
    Promise.resolve({ data: mocks.rows, error: mocks.error }).then(resolve),
};

vi.mock("server-only", () => ({}));
vi.mock("@/server/policies/auth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/server/db/admin", () => ({
  createSupabaseAdminClient: () => ({ from: mocks.from }),
}));

import { getAdminLedgerEntries } from "@/server/views/admin-ledger";

describe("admin ledger view boundary", () => {
  beforeEach(() => {
    mocks.requireAdmin.mockReset().mockImplementation(async () => {
      mocks.orderOfOperations.push("authorize");
    });
    mocks.from.mockReset().mockImplementation(() => {
      mocks.orderOfOperations.push("database");
      return query;
    });
    mocks.select.mockReset().mockImplementation(() => query);
    mocks.order.mockReset().mockImplementation(() => query);
    mocks.limit.mockReset().mockImplementation(() => query);
    mocks.rows = [];
    mocks.error = null;
    mocks.orderOfOperations.length = 0;
  });

  it("authorizes admin before database access and maps entries cleanly", async () => {
    mocks.rows = [
      {
        id: "entry-1",
        booking_id: "book-1",
        kind: "host_payment",
        amount_cents: "36000",
        description: "Payment received",
        ref: "PAY-123",
        created_at: "2026-11-04T10:00:00Z",
      },
    ];

    const result = await getAdminLedgerEntries(50);

    expect(mocks.orderOfOperations.slice(0, 2)).toEqual(["authorize", "database"]);
    expect(mocks.from).toHaveBeenCalledWith("ledger_entries");
    expect(mocks.limit).toHaveBeenCalledWith(50);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([
        {
          id: "entry-1",
          bookingId: "book-1",
          kind: "host_payment",
          amountCents: BigInt(36000),
          description: "Payment received",
          ref: "PAY-123",
          createdAt: "2026-11-04T10:00:00Z",
        },
      ]);
    }
  });

  it("fails safely if database query returns an error", async () => {
    mocks.error = { message: "DB connection failure" };

    const result = await getAdminLedgerEntries();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("internal_error");
    }
  });
});
