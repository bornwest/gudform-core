import { afterEach, describe, expect, it } from "vitest";

import { originFromHostHeader } from "@/lib/app-origin";

const fallback = "https://gudform.com";

describe("originFromHostHeader", () => {
  const originalEnv = process.env.VERCEL_ENV;

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = originalEnv;
  });

  it("uses the preview git alias so verify links hit the preview database", () => {
    expect(
      originFromHostHeader(
        "gudform-git-fix-gudform-oss-sync-tertsea-uzuas-projects.vercel.app",
        fallback,
      ),
    ).toBe(
      "https://gudform-git-fix-gudform-oss-sync-tertsea-uzuas-projects.vercel.app",
    );
  });

  it("keeps production and local hosts", () => {
    expect(originFromHostHeader("gudform.com", fallback)).toBe(
      "https://gudform.com",
    );
    expect(originFromHostHeader("www.gudform.com", fallback)).toBe(
      "https://www.gudform.com",
    );
    expect(originFromHostHeader("localhost:3000", fallback)).toBe(
      "http://localhost:3000",
    );
  });

  it("rejects unknown hosts", () => {
    expect(originFromHostHeader("evil.example", fallback)).toBe(fallback);
    expect(originFromHostHeader("", fallback)).toBe(fallback);
    expect(originFromHostHeader(null, fallback)).toBe(fallback);
  });
});
