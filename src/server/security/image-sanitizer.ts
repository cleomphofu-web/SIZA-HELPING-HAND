import "server-only";

import sharp from "sharp";
import { MAX_UPLOAD_BYTES, type HelperImageExtension } from "@/server/security/uploads";

const MAX_INPUT_PIXELS = 20_000_000;

type SanitizedHelperImage = {
  bytes: Buffer;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  ext: HelperImageExtension;
};

const formats = {
  jpeg: { ext: "jpg", contentType: "image/jpeg" },
  png: { ext: "png", contentType: "image/png" },
  webp: { ext: "webp", contentType: "image/webp" },
} as const satisfies Record<string, { ext: HelperImageExtension; contentType: SanitizedHelperImage["contentType"] }>;

export async function sanitizeHelperImage(bytes: Uint8Array): Promise<SanitizedHelperImage | null> {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_UPLOAD_BYTES) return null;

  try {
    const input = sharp(bytes, {
      failOn: "warning",
      limitInputPixels: MAX_INPUT_PIXELS,
      limitInputChannels: 4,
      sequentialRead: true,
    });
    const metadata = await input.metadata();
    if (!metadata.format || !Object.hasOwn(formats, metadata.format)) return null;

    const format = formats[metadata.format as keyof typeof formats];
    const encoder = input.autoOrient();
    const sanitized = metadata.format === "jpeg"
      ? await encoder.jpeg({ quality: 88, mozjpeg: true }).toBuffer()
      : metadata.format === "png"
        ? await encoder.png({ compressionLevel: 9 }).toBuffer()
        : await encoder.webp({ quality: 88 }).toBuffer();

    if (sanitized.byteLength === 0 || sanitized.byteLength > MAX_UPLOAD_BYTES) return null;
    return { bytes: sanitized, contentType: format.contentType, ext: format.ext };
  } catch {
    return null;
  }
}
