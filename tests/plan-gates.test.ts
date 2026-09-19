import { describe, expect, it } from "vitest";

import { assertPlanFeature } from "@/lib/plan-gates";
import { PLANS } from "@/config/subscriptions";

describe("assertPlanFeature", () => {
  it("allows webhooks on Starter and above", () => {
    expect(() =>
      assertPlanFeature(PLANS.STARTER, "webhooks", "Webhooks"),
    ).not.toThrow();
  });

  it("blocks webhooks on Free", () => {
    expect(() =>
      assertPlanFeature(PLANS.FREE, "webhooks", "Webhooks"),
    ).toThrow(/Webhooks/);
  });

  it("blocks branding removal on Free", () => {
    expect(() =>
      assertPlanFeature(PLANS.FREE, "customBranding", "Custom branding"),
    ).toThrow(/Custom branding/);
  });

  it("blocks payment collection on Starter", () => {
    expect(() =>
      assertPlanFeature(PLANS.STARTER, "paymentCollection", "Payments"),
    ).toThrow(/Payments/);
  });
});
