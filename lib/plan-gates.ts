import type { PlanConfig, PlanFeatures } from "@/config/subscriptions";

export function assertPlanFeature(
  plan: PlanConfig,
  feature: keyof PlanFeatures,
  label: string,
): void {
  if (!plan.features[feature]) {
    throw new Error(`${label} is not available on the ${plan.name} plan`);
  }
}
