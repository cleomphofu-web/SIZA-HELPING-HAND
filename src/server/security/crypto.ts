import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { env } from "@/server/config/env";

function keyBytes() {
  return Buffer.from(env.ID_ENCRYPTION_KEY, "base64");
}

export function encryptIdNumber(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyBytes(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decryptIdNumber(payload: string): string {
  const bytes = Buffer.from(payload, "base64");
  if (bytes.length < 28) throw new Error("Invalid encrypted ID payload");
  const decipher = createDecipheriv("aes-256-gcm", keyBytes(), bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8");
}

export function hashIdentifier(value: string): string {
  return createHmac("sha256", keyBytes()).update(value.trim()).digest("hex");
}
