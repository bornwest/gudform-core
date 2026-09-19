/**
 * Build an http(s) origin from a Host / X-Forwarded-Host value.
 * Unknown hosts fall back so a spoofed Host header cannot mint auth links.
 */
export function originFromHostHeader(
  hostHeader: string | null | undefined,
  fallback: string,
): string {
  const base = fallback.replace(/\/+$/, "");
  const host = (hostHeader || "").split(",")[0].trim().toLowerCase();
  if (!host) return base;

  const hostname = host.replace(/:\d+$/, "");
  const allowed =
    hostname === "gudform.com" ||
    hostname === "www.gudform.com" ||
    hostname === "localhost" ||
    hostname.endsWith(".vercel.app");
  if (!allowed) return base;

  const proto = hostname === "localhost" ? "http" : "https";
  return `${proto}://${host}`;
}

function configuredAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
}

/**
 * Origin for auth and invite emails. Preview deploys use a separate database
 * from gudform.com, so verification links must stay on the preview host.
 */
export async function getAppOrigin(): Promise<string> {
  const fallback = configuredAppUrl();
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host");
    if (host) {
      return originFromHostHeader(host, fallback);
    }
  } catch {
    // Not in a request (tests, scripts, queued work).
  }

  if (process.env.VERCEL_ENV === "preview") {
    return originFromHostHeader(
      process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL,
      fallback,
    );
  }

  return fallback;
}
