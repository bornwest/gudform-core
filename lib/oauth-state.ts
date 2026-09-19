import crypto from "crypto";

import { env } from "@/env.mjs";

/**
 * HMAC-SHA256 sign an OAuth state payload.
 * Format: base64url(json).signature
 */
export function signOAuthState(payload: Record<string, string>): string {
  const json = JSON.stringify(payload);
  const data = Buffer.from(json).toString("base64url");
  const signature = crypto
    .createHmac("sha256", env.AUTH_SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

/**
 * Verify and parse a signed OAuth state string.
 * Returns the parsed payload or null if the signature is invalid.
 */
export function verifyOAuthState(
  state: string,
): Record<string, string> | null {
  const dotIndex = state.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const data = state.substring(0, dotIndex);
  const signature = state.substring(dotIndex + 1);

  const expected = crypto
    .createHmac("sha256", env.AUTH_SECRET)
    .update(data)
    .digest("base64url");

  // Timing-safe comparison
  const sigBuf = Buffer.from(signature, "base64url");
  const expBuf = Buffer.from(expected, "base64url");

  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const json = Buffer.from(data, "base64url").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}
