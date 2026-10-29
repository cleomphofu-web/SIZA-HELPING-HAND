import { describe, expect, it, vi } from "vitest";
import { pruneExpiredRateLimitCounters, purgeExpiredHelperDocuments } from "@/server/services/retention";

vi.mock("server-only", () => ({}));

type Document = { id: string; storage_path: string; delete_after: string };

function makeClient(documents: Document[], removeFails: string[] = [], deleteFails: string[] = []) {
  const selectedCursors: Array<string | null> = [];
  const removed: string[] = [];
  const deleted: string[] = [];
  const operations: string[] = [];
  const batchSize = 100;
  const from = vi.fn(() => {
    let cursor: string | null = null;
    let isDelete = false;
    const query = {
      select: vi.fn(() => query),
      lte: vi.fn(() => query),
      gt: vi.fn((_column: string, value: string) => { cursor = value; return query; }),
      order: vi.fn(() => query),
      limit: vi.fn(() => query),
      delete: vi.fn(() => { isDelete = true; return query; }),
      eq: vi.fn(async (_column: string, id: string) => {
        deleted.push(id);
        operations.push(`metadata:${id}`);
        return { error: deleteFails.includes(id) ? { message: "synthetic delete failure" } : null };
      }),
      then: (resolve: (value: unknown) => unknown) => {
        selectedCursors.push(cursor);
        const page = documents.filter((document) => document.delete_after <= nowIso && (!cursor || document.id > cursor)).slice(0, batchSize);
        return Promise.resolve(isDelete ? { data: null, error: null } : { data: page, error: null }).then(resolve);
      },
    };
    return query;
  });
  const nowIso = "2026-10-26T00:00:00.000Z";
  const storage = { remove: vi.fn(async ([path]: string[]) => {
    removed.push(path);
    operations.push(`object:${path}`);
    return { error: removeFails.includes(path) ? { message: "synthetic storage failure" } : null };
  }) };
  return { client: { from, storage: { from: vi.fn(() => storage) } }, from, storage, removed, deleted, operations, selectedCursors, nowIso };
}

describe("expired helper document retention", () => {
  it("walks expired documents in bounded id order and removes object before metadata", async () => {
    const expires = "2026-10-25T00:00:00.000Z";
    const documents = Array.from({ length: 205 }, (_, index) => ({
      id: index.toString().padStart(3, "0"),
      storage_path: `helper/${index}.jpg`,
      delete_after: expires,
    }));
    const mocks = makeClient(documents);

    const result = await purgeExpiredHelperDocuments(mocks.client as never, new Date(mocks.nowIso));

    expect(result).toEqual({ deleted: 205, failed: 0 });
    expect(mocks.removed).toEqual(documents.map((document) => document.storage_path));
    expect(mocks.deleted).toEqual(documents.map((document) => document.id));
    expect(mocks.operations).toEqual(documents.flatMap((document) => [`object:${document.storage_path}`, `metadata:${document.id}`]));
    expect(mocks.selectedCursors).toEqual([null, "099", "199"]);
  });

  it("leaves metadata for retry when object deletion or row deletion fails", async () => {
    const documents = [
      { id: "001", storage_path: "helper/storage-failure.jpg", delete_after: "2026-10-25T00:00:00.000Z" },
      { id: "002", storage_path: "helper/row-failure.jpg", delete_after: "2026-10-25T00:00:00.000Z" },
      { id: "003", storage_path: "helper/deleted.jpg", delete_after: "2026-10-25T00:00:00.000Z" },
    ];
    const mocks = makeClient(documents, [documents[0].storage_path], [documents[1].id]);

    const result = await purgeExpiredHelperDocuments(mocks.client as never, new Date(mocks.nowIso));

    expect(result).toEqual({ deleted: 1, failed: 2 });
    expect(mocks.removed).toEqual(documents.map((document) => document.storage_path));
    expect(mocks.deleted).toEqual(["002", "003"]);
  });
});

describe("expired Postgres rate-limit counter retention", () => {
  it("prunes a bounded batch through the service-only database function", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 17, error: null });
    await expect(pruneExpiredRateLimitCounters({ rpc } as never)).resolves.toBe(17);
    expect(rpc).toHaveBeenCalledWith("prune_expired_rate_limit_counters", { p_limit: 500 });
  });

  it("fails safely when pruning fails or the requested batch is invalid", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: new Error("private database detail") });
    await expect(pruneExpiredRateLimitCounters({ rpc } as never)).rejects.toThrow("Could not prune expired rate-limit counters.");
    await expect(pruneExpiredRateLimitCounters({ rpc } as never, 0)).rejects.toThrow("Invalid rate-limit retention batch.");
    expect(rpc).toHaveBeenCalledOnce();
  });
});
