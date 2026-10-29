import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/server/config/env", () => ({ env: { ID_ENCRYPTION_KEY: "synthetic-test-key" } }));
vi.mock("@/server/security/crypto", () => ({ encryptIdNumber: (value: string) => `encrypted:${value}`, hashIdentifier: (value: string) => `hash:${value}` }));
import { helperProfileSchema } from "@/lib/schemas";
import { saveHelperProfile } from "@/server/services/phase-a";

function makeServiceClient(options: { failUploadAt?: number; rpcError?: { code?: string } | null; rpcThrows?: boolean } = {}) {
  const uploads: Array<{ path: string; body: File | Buffer; options: { contentType?: string } }> = [];
  const from = vi.fn((table: string) => { throw new Error(`Unexpected table access in intake RPC path: ${table}`); });
  const removed: string[][] = [];
  const rpc = vi.fn(async () => {
    if (options.rpcThrows) throw new Error("synthetic transport timeout");
    return { data: null, error: options.rpcError ?? null };
  });
  const upload = vi.fn(async (path: string, body: File | Buffer, options: { contentType?: string }) => {
    uploads.push({ path, body, options });
    return { error: uploads.length === optionsOuter.failUploadAt ? { message: "synthetic upload failure" } : null, data: { path } };
  });
  const optionsOuter = options;
  const remove = vi.fn(async (paths: string[]) => { removed.push(paths); return { error: null }; });
  const client = {
    from,
    rpc,
    storage: { from: () => ({ upload, remove }) },
  };
  return { client, from, rpc, upload, uploads, remove, removed };
}

const profile = helperProfileSchema.parse({
  dateOfBirth: new Date("1980-01-01T00:00:00.000Z"),
  jobTitle: "Home helper",
  services: ["home_cleaning"],
  suburbs: ["Johannesburg"],
  idNumber: "8001015009087",
  consent: true,
});

describe("helper profile image intake", () => {
  it("stores re-encoded images with metadata stripped and MIME derived from decoded bytes", async () => {
    const originalBytes = await sharp({
      create: { width: 2, height: 3, channels: 3, background: { r: 100, g: 80, b: 60 } },
    })
      .withExif({ IFD0: { Artist: "synthetic fixture" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "0/1 0/1 0/1" } })
      .jpeg()
      .toBuffer();
    const file = new File([new Uint8Array(originalBytes)], "id.png", { type: "image/png" });
    const { client, uploads, rpc, from } = makeServiceClient();

    const result = await saveHelperProfile(client as never, "helper-test-id", profile, { idPhoto: file, selfieCheck: file });

    expect(result.ok).toBe(true);
    expect(uploads).toHaveLength(2);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(from).not.toHaveBeenCalled();
    for (const upload of uploads) {
      expect(upload.path).toMatch(/\.jpg$/);
      expect(upload.options.contentType).toBe("image/jpeg");
      expect(upload.body).not.toBe(file);
      const output = await sharp(upload.body as Buffer).metadata();
      expect(output.exif).toBeUndefined();
    }
  });

  it("rejects a corrupt image before creating the profile or uploading either document", async () => {
    const corruptFile = new File([new Uint8Array([0xff, 0xd8, 0xff, 0x00])], "id.jpg", { type: "image/jpeg" });
    const { client, from, uploads } = makeServiceClient();

    const result = await saveHelperProfile(client as never, "helper-test-id", profile, { idPhoto: corruptFile, selfieCheck: corruptFile });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("validation_failed");
    expect(from).not.toHaveBeenCalled();
    expect(uploads).toHaveLength(0);
  });

  it("removes the first staged image when the second storage upload fails without creating database rows", async () => {
    const image = await sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } }).jpeg().toBuffer();
    const file = new File([new Uint8Array(image)], "id.jpg", { type: "image/jpeg" });
    const { client, uploads, rpc, remove, removed } = makeServiceClient({ failUploadAt: 2 });

    const result = await saveHelperProfile(client as never, "helper-test-id", profile, { idPhoto: file, selfieCheck: file });

    expect(result.ok).toBe(false);
    expect(uploads).toHaveLength(2);
    expect(rpc).not.toHaveBeenCalled();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(removed[0]).toEqual(uploads.map(({ path }) => path));
  });

  it("removes both staged images when the atomic application insert fails", async () => {
    const image = await sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } }).jpeg().toBuffer();
    const file = new File([new Uint8Array(image)], "id.jpg", { type: "image/jpeg" });
    const { client, uploads, rpc, remove, removed } = makeServiceClient({ rpcError: { code: "23505" } });

    const result = await saveHelperProfile(client as never, "helper-test-id", profile, { idPhoto: file, selfieCheck: file });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("conflict");
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(removed[0]).toEqual(uploads.map(({ path }) => path));
  });

  it("keeps staged images when the application RPC outcome is unknown", async () => {
    const image = await sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } }).jpeg().toBuffer();
    const file = new File([new Uint8Array(image)], "id.jpg", { type: "image/jpeg" });
    const { client, uploads, rpc, remove } = makeServiceClient({ rpcThrows: true });

    const result = await saveHelperProfile(client as never, "helper-test-id", profile, { idPhoto: file, selfieCheck: file });

    expect(result.ok).toBe(false);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(uploads).toHaveLength(2);
    expect(remove).not.toHaveBeenCalled();
  });
});
