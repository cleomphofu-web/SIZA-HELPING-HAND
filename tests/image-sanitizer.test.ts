import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { sanitizeHelperImage } from "@/server/security/image-sanitizer";

describe("helper image sanitization", () => {
  it("auto-orients the image and strips EXIF including GPS before returning it", async () => {
    const input = await sharp({
      create: { width: 2, height: 3, channels: 3, background: { r: 100, g: 80, b: 60 } },
    })
      .withExif({
        IFD0: { Artist: "synthetic fixture" },
        IFD3: {
          GPSLatitudeRef: "N",
          GPSLatitude: "0/1 0/1 0/1",
          GPSLongitudeRef: "E",
          GPSLongitude: "0/1 0/1 0/1",
        },
      })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();

    const sanitized = await sanitizeHelperImage(new Uint8Array(input));

    expect(sanitized).not.toBeNull();
    expect(sanitized?.ext).toBe("jpg");
    expect(sanitized?.contentType).toBe("image/jpeg");
    const outputMetadata = await sharp(sanitized!.bytes).metadata();
    expect(outputMetadata.width).toBe(3);
    expect(outputMetadata.height).toBe(2);
    expect(outputMetadata.orientation).toBeUndefined();
    expect(outputMetadata.exif).toBeUndefined();
  });

  it("rejects bytes that pass a signature check but cannot be decoded as an image", async () => {
    expect(await sanitizeHelperImage(new Uint8Array([0xff, 0xd8, 0xff, 0x00]))).toBeNull();
  });

  it("rejects PDF and other decoded formats even if called directly", async () => {
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
    expect(await sanitizeHelperImage(pdf)).toBeNull();
  });
});
