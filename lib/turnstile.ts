export const TURNSTILE_FAIL_MESSAGE =
  "Couldn't verify this submission. Try again.";

export const TURNSTILE_FORM_SUBMIT_ACTION = "form_submit";

export function isTurnstileEnabled(): boolean {
  return Boolean(
    process.env.TURNSTILE_SECRET && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  );
}

function allowedHostnames(): Set<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  let host = "";
  try {
    host = new URL(appUrl).hostname;
  } catch {
    host = "";
  }
  const allowed = new Set<string>();
  if (host) allowed.add(host);
  if (host === "localhost" || host === "127.0.0.1") {
    allowed.add("localhost");
    allowed.add("127.0.0.1");
  }
  return allowed;
}

export async function verifyTurnstile(
  token: string,
  action: string,
): Promise<void> {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret || !token.trim()) {
    throw new Error(TURNSTILE_FAIL_MESSAGE);
  }

  let response: Response;
  try {
    response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret,
          response: token,
        }),
      },
    );
  } catch {
    throw new Error(TURNSTILE_FAIL_MESSAGE);
  }

  if (!response.ok) {
    throw new Error(TURNSTILE_FAIL_MESSAGE);
  }

  const result = (await response.json()) as {
    success?: boolean;
    action?: string;
    hostname?: string;
  };

  if (
    result.success !== true ||
    result.action !== action ||
    !result.hostname ||
    !allowedHostnames().has(result.hostname)
  ) {
    throw new Error(TURNSTILE_FAIL_MESSAGE);
  }
}

export async function requireTurnstileForPublicSubmit(
  token: string | undefined,
): Promise<void> {
  if (!isTurnstileEnabled()) return;
  await verifyTurnstile(token ?? "", TURNSTILE_FORM_SUBMIT_ACTION);
}
