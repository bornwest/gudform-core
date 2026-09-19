import { describe, expect, it } from "vitest";

import { getOnboardingProgress } from "@/lib/onboarding";

describe("getOnboardingProgress", () => {
  it("starts at create when there are no forms", () => {
    const progress = getOnboardingProgress([]);
    expect(progress.completed).toEqual([]);
    expect(progress.next).toBe("create");
    expect(progress.done).toBe(false);
  });

  it("advances through publish, share, and first response", () => {
    expect(
      getOnboardingProgress([{ status: "DRAFT", publishedAt: null, responses: 0 }])
        .next,
    ).toBe("publish");

    expect(
      getOnboardingProgress([
        { status: "PUBLISHED", publishedAt: new Date(), responses: 0 },
      ]).next,
    ).toBe("share");

    const finished = getOnboardingProgress([
      { status: "PUBLISHED", publishedAt: new Date(), responses: 1 },
    ]);
    expect(finished.next).toBeNull();
    expect(finished.done).toBe(true);
    expect(finished.completed).toEqual([
      "create",
      "publish",
      "share",
      "response",
    ]);
  });
});
