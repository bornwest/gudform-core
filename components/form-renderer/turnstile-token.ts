export const TURNSTILE_FORM_SUBMIT_ACTION = "form_submit";

const FAIL_MESSAGE = "Couldn't verify this submission. Try again.";

// Upper bound on waiting for a token, so a widget that never calls back
// can't leave the submit button spinning forever.
const TOKEN_TIMEOUT_MS = 30_000;

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      // Invisible mode is set on the sitekey in the Cloudflare dashboard;
      // `size` only accepts "normal" | "compact" | "flexible".
      execution: "render" | "execute";
      callback: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
      "timeout-callback"?: () => void;
    },
  ) => string;
  execute: (widgetId: string) => void;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

function sitekey(): string | undefined {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}

export function isTurnstileClientEnabled(): boolean {
  return Boolean(sitekey());
}

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  const existing = document.querySelector(
    'script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]',
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      if (window.turnstile) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(FAIL_MESSAGE)), {
        once: true,
      });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(FAIL_MESSAGE));
    document.head.appendChild(script);
  });
}

export async function getTurnstileToken(): Promise<string | undefined> {
  const key = sitekey();
  if (!key) return undefined;
  await loadScript();
  const api = window.turnstile;
  if (!api) {
    throw new Error(FAIL_MESSAGE);
  }

  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  document.body.appendChild(container);

  return new Promise((resolve, reject) => {
    let widgetId: string | undefined;
    let settled = false;

    const finish = (token?: string) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (widgetId !== undefined) {
        try {
          api.remove(widgetId);
        } catch {
          /* ignore */
        }
      }
      container.remove();
      if (token) resolve(token);
      else reject(new Error(FAIL_MESSAGE));
    };

    const fail = () => finish();
    const timer = window.setTimeout(fail, TOKEN_TIMEOUT_MS);

    try {
      widgetId = api.render(container, {
        sitekey: key,
        action: TURNSTILE_FORM_SUBMIT_ACTION,
        execution: "execute",
        callback: (token) => finish(token),
        "error-callback": fail,
        "expired-callback": fail,
        "timeout-callback": fail,
      });
      api.execute(widgetId);
    } catch {
      fail();
    }
  });
}
