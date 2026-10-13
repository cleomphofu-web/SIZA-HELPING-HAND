const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

type UploadType = "jpg" | "png" | "webp" | "pdf";
type UploadResult = { ok: true; ext: UploadType } | { ok: false; reason: string };

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((byte, index) => bytes[index] === byte);
}

export function validateUpload(file: { name: string; size: number; bytes: Uint8Array }): UploadResult {
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, reason: "File must be 8 MB or smaller" };
  if (file.size !== file.bytes.byteLength) return { ok: false, reason: "File size could not be verified" };
  if (startsWith(file.bytes, [0xff, 0xd8, 0xff])) return { ok: true, ext: "jpg" };
  if (startsWith(file.bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { ok: true, ext: "png" };
  if (startsWith(file.bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return { ok: true, ext: "pdf" };
  if (file.bytes.length >= 12 && String.fromCharCode(...file.bytes.subarray(0, 4)) === "RIFF" && String.fromCharCode(...file.bytes.subarray(8, 12)) === "WEBP") return { ok: true, ext: "webp" };
  return { ok: false, reason: "Unsupported or invalid file type" };
}
