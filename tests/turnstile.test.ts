import { afterEach, describe, expect, it, vi } from "vitest";

import {
  TURNSTILE_FAIL_MESSAGE,
  isTurnstileEnabled,
  requireTurnstileForPublicSubmit,
  verifyTurnstile,
} from "@/lib/turnstile";

const envKeys = [
  "TURNSTILE_SECRET",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "NEXT_PUBLIC_APP_URL",
] as const;

const originals: Record<string, string | undefined> = {};
for (const key of envKeys) {
  originals[key] = process.env[key];
}

afterEach(() => {
  vi.unstubAllGlobals();
  for (const key of envKeys) {
    const value = originals[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function enableTurnstile(appUrl: string) {
  process.env.TURNSTILE_SECRET = "test-secret";
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "test-sitekey";
  process.env.NEXT_PUBLIC_APP_URL = appUrl;
}

function mockSiteverify(body: Record<string, unknown>, httpOk = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: httpOk,
      json: async () => body,
    }),
  );
}

describe("isTurnstileEnabled", () => {
  it("is off when either key is missing", () => {
    delete process.env.TURNSTILE_SECRET;
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "site";
    expect(isTurnstileEnabled()).toBe(false);
    process.env.TURNSTILE_SECRET = "secret";
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    expect(isTurnstileEnabled()).toBe(false);
  });

  it("is on when both keys are set", () => {
    enableTurnstile("https://gudform.com");
    expect(isTurnstileEnabled()).toBe(true);
  });
});

describe("verifyTurnstile", () => {
  it("rejects an empty token", async () => {
    enableTurnstile("https://gudform.com");
    await expect(verifyTurnstile("", "form_submit")).rejects.toThrow(
      TURNSTILE_FAIL_MESSAGE,
    );
  });

  it("rejects success false", async () => {
    enableTurnstile("https://gudform.com");
    mockSiteverify({
      success: false,
      hostname: "gudform.com",
      action: "form_submit",
    });
    await expect(verifyTurnstile("tok", "form_submit")).rejects.toThrow(
      TURNSTILE_FAIL_MESSAGE,
    );
  });

  it("rejects the wrong action", async () => {
    enableTurnstile("https://gudform.com");
    mockSiteverify({
      success: true,
      hostname: "gudform.com",
      action: "register",
    });
    await expect(verifyTurnstile("tok", "form_submit")).rejects.toThrow(
      TURNSTILE_FAIL_MESSAGE,
    );
  });

  it("rejects a hostname not on the allowlist", async () => {
    enableTurnstile("https://gudform.com");
    mockSiteverify({
      success: true,
      hostname: "evil.example",
      action: "form_submit",
    });
    await expect(verifyTurnstile("tok", "form_submit")).rejects.toThrow(
      TURNSTILE_FAIL_MESSAGE,
    );
  });

  it("rejects localhost when the app URL is production", async () => {
    enableTurnstile("https://gudform.com");
    mockSiteverify({
      success: true,
      hostname: "localhost",
      action: "form_submit",
    });
    await expect(verifyTurnstile("tok", "form_submit")).rejects.toThrow(
      TURNSTILE_FAIL_MESSAGE,
    );
  });

  it("accepts the app URL hostname and matching action", async () => {
    enableTurnstile("https://gudform.com");
    mockSiteverify({
      success: true,
      hostname: "gudform.com",
      action: "form_submit",
    });
    await expect(verifyTurnstile("tok", "form_submit")).resolves.toBeUndefined();
  });

  it("accepts localhost when the app URL is localhost", async () => {
    enableTurnstile("http://localhost:3000");
    mockSiteverify({
      success: true,
      hostname: "127.0.0.1",
      action: "form_submit",
    });
    await expect(verifyTurnstile("tok", "form_submit")).resolves.toBeUndefined();
  });

  it("fails closed when siteverify is unreachable", async () => {
    enableTurnstile("https://gudform.com");
    mockSiteverify(
      { success: true, hostname: "gudform.com", action: "form_submit" },
      false,
    );
    await expect(verifyTurnstile("tok", "form_submit")).rejects.toThrow(
      TURNSTILE_FAIL_MESSAGE,
    );
  });
});

describe("requireTurnstileForPublicSubmit", () => {
  it("no-ops when Turnstile is disabled", async () => {
    delete process.env.TURNSTILE_SECRET;
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    await expect(
      requireTurnstileForPublicSubmit(undefined),
    ).resolves.toBeUndefined();
  });

  it("rejects a missing token when enabled", async () => {
    enableTurnstile("https://gudform.com");
    await expect(requireTurnstileForPublicSubmit(undefined)).rejects.toThrow(
      TURNSTILE_FAIL_MESSAGE,
    );
  });
});
