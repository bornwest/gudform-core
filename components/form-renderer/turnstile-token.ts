export const TURNSTILE_FORM_SUBMIT_ACTION = "form_submit";

const FAIL_MESSAGE = "Couldn't verify this submission. Try again.";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      size: "invisible";
      callback: (token: string) => void;
      "error-callback"?: () => void;
    },
  ) => string;
  execute?: (widgetId: string) => void;
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
    const cleanup = (widgetId: string) => {
      try {
        api.remove(widgetId);
      } catch {
        /* ignore */
      }
      container.remove();
    };

    const widgetId = api.render(container, {
      sitekey: key,
      action: TURNSTILE_FORM_SUBMIT_ACTION,
      size: "invisible",
      callback: (token) => {
        cleanup(widgetId);
        resolve(token);
      },
      "error-callback": () => {
        cleanup(widgetId);
        reject(new Error(FAIL_MESSAGE));
      },
    });
    api.execute?.(widgetId);
  });
}
