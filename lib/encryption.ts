import crypto from "crypto";

import { env } from "@/env.mjs";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

function getKey(): Buffer {
  const hex = env.ENCRYPTION_KEY;
  if (!hex) {
    throw new Error(
      "ENCRYPTION_KEY is required to encrypt OAuth credentials. Generate one with: openssl rand -hex 32",
    );
  }
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). " +
        `Got ${hex.length} hex characters.`,
    );
  }
  return key;
}

/**
 * Encrypt a JSON-serializable value using AES-256-GCM.
 * Returns a string in the format: `iv:ciphertext:authTag` (all hex-encoded).
 */
export function encryptJson(data: unknown): string {
  const plaintext = JSON.stringify(data);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    encrypted.toString("hex"),
    tag.toString("hex"),
  ].join(":");
}

/**
 * Decrypt a string produced by `encryptJson` back to the original value.
 */
export function decryptJson<T = unknown>(encrypted: string): T {
  const [ivHex, ciphertextHex, tagHex] = encrypted.split(":");
  if (!ivHex || !ciphertextHex || !tagHex) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}

/**
 * Check whether a value looks like an encrypted string (iv:ciphertext:tag).
 * Useful for migrating from plaintext to encrypted storage.
 */
export function isEncrypted(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parts = value.split(":");
  return parts.length === 3 && parts.every((p) => /^[0-9a-f]+$/.test(p));
}
