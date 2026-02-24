export interface PlanFeatures {
  maxForms: number;
  maxResponsesPerForm: number;
  maxTeamMembers: number;
  customBranding: boolean;
  webhooks: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  paymentCollection: boolean;
  maxStorageBytes: number; // -1 = unlimited
  fileRetentionDays: number | null; // null = unlimited
}

export interface PlanConfig {
  name: string;
  description: string;
  price: number;
  features: PlanFeatures;
}

// Self-hosted: single plan with everything unlocked
export const SELF_HOSTED_PLAN: PlanConfig = {
  name: "Self-Hosted",
  description: "All features unlocked",
  price: 0,
  features: {
    maxForms: -1,
    maxResponsesPerForm: -1,
    maxTeamMembers: -1,
    customBranding: true,
    webhooks: true,
    apiAccess: true,
    prioritySupport: true,
    paymentCollection: true,
    maxStorageBytes: -1,
    fileRetentionDays: null,
  },
};

export function getFeatureLimitDisplay(value: number): string {
  return value === -1 ? "Unlimited" : String(value);
}
