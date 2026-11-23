/**
 * The submitter's IP address, read from the proxy headers on the request.
 * Uses the first (client) entry of `x-forwarded-for`, falling back to
 * `x-real-ip`. Only trustworthy when the app sits behind a proxy that sets
 * these headers itself.
 */
export function getRequestIp(headers: Headers): string | undefined {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return headers.get("x-real-ip")?.trim() || undefined;
}
