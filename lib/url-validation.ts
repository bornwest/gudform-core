/**
 * URL validation utilities to prevent SSRF and open redirect attacks.
 */

const PRIVATE_IP_RANGES = [
  // IPv4
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  // IPv6
  /^::1$/,
  /^fc00:/i,
  /^fd/i,
  /^fe80:/i,
];

const BLOCKED_HOSTNAMES = [ "localhost", "metadata.google.internal" ];

// A URL scheme such as "https:" or "mailto:".
const URL_SCHEME = /^[a-z][a-z\d+.-]*:(?!\d)/i;

function isPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.includes(lower)) return true;
  return PRIVATE_IP_RANGES.some((re) => re.test(lower));
}

/**
 * Validate a webhook URL: must be HTTPS and not point to private/internal IPs.
 */
export function validateWebhookUrl(url: string): { valid: boolean; error?: string } {
  let parsed: URL;
  
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  if (parsed.protocol !== "https:") {
    return { valid: false, error: "Webhook URL must use HTTPS" };
  }

  if (isPrivateHost(parsed.hostname)) {
    return { valid: false, error: "Webhook URL must not point to a private or internal address" };
  }

  return { valid: true };
}

/**
 * Validate a redirect URL: must be HTTP or HTTPS and not point to private/internal IPs.
 */
/**
 * Validate a GitHub URL: must be https://github.com/...
 */
export function validateGithubUrl(url: string): { valid: boolean; error?: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  if (parsed.protocol !== "https:") {
    return { valid: false, error: "GitHub URL must use HTTPS" };
  }

  if (parsed.hostname !== "github.com") {
    return { valid: false, error: "URL must be a github.com URL" };
  }

  return { valid: true };
}

/**
 * Validate an HTTPS URL: must be HTTPS and not point to private/internal IPs.
 */
export function validateHttpsUrl(url: string): { valid: boolean; error?: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  if (parsed.protocol !== "https:") {
    return { valid: false, error: "URL must use HTTPS" };
  }

  if (isPrivateHost(parsed.hostname)) {
    return { valid: false, error: "URL must not point to a private or internal address" };
  }

  return { valid: true };
}

export function validateRedirectUrl(url: string): { valid: boolean; error?: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, error: "Redirect URL must use HTTP or HTTPS" };
  }

  if (isPrivateHost(parsed.hostname)) {
    return { valid: false, error: "Redirect URL must not point to a private or internal address" };
  }

  return { valid: true };
}

/**
 * Turn what someone typed into a redirect URL, adding "https://" when they
 * left the scheme off (e.g. "bornwest.com" → "https://bornwest.com").
 */
export function normalizeRedirectUrlInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  return URL_SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`;
}
