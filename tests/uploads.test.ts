import { describe, expect, it } from "vitest";
import { validateUpload } from "@/server/security/uploads";

describe("upload validation", () => {
  it("accepts a real PNG signature", () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(validateUpload({ name: "photo.jpg", size: bytes.length, bytes })).toEqual({ ok: true, ext: "png" });
  });
  it("rejects an executable renamed as an image", () => {
    const bytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]);
    expect(validateUpload({ name: "id.jpg", size: bytes.length, bytes }).ok).toBe(false);
  });
  it("rejects files over 8 MB", () => {
    const bytes = new Uint8Array(8 * 1024 * 1024 + 1);
    expect(validateUpload({ name: "large.png", size: bytes.length, bytes }).ok).toBe(false);
  });
  it("rejects PDF because helper selfie and ID uploads are image-only", () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
    expect(validateUpload({ name: "document.pdf", size: bytes.length, bytes }).ok).toBe(false);
  });
});
