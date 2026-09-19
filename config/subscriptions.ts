export const SubscriptionPlan = {
  FREE: "FREE",
  STARTER: "STARTER",
  PRO: "PRO",
  BUSINESS: "BUSINESS",
} as const;

export type SubscriptionPlan =
  (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];

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
  plan: SubscriptionPlan;
  price: number;
  priceId: string | null;
  features: PlanFeatures;
  popular?: boolean;
}

export const PLANS: Record<SubscriptionPlan, PlanConfig> = {
  FREE: {
    name: "Free",
    description: "Unlimited forms and submissions for individuals",
    plan: SubscriptionPlan.FREE,
    price: 0,
    priceId: null,
    features: {
      maxForms: -1, // unlimited
      maxResponsesPerForm: -1, // unlimited
      maxTeamMembers: 0,
      customBranding: false,
      webhooks: false,
      apiAccess: true,
      prioritySupport: false,
      paymentCollection: false,
      maxStorageBytes: 100 * 1024 * 1024, // 100 MB
      fileRetentionDays: 30,
    },
  },
  STARTER: {
    name: "Starter",
    description: "For creators who need more",
    plan: SubscriptionPlan.STARTER,
    price: 5,
    priceId: process.env.STRIPE_STARTER_MONTHLY_PLAN_ID || null,
    features: {
      maxForms: -1, // unlimited
      maxResponsesPerForm: -1, // unlimited
      maxTeamMembers: 0,
      customBranding: false,
      webhooks: true,
      apiAccess: true,
      prioritySupport: false,
      paymentCollection: false,
      maxStorageBytes: 500 * 1024 * 1024, // 500 MB
      fileRetentionDays: 30,
    },
  },
  PRO: {
    name: "Pro",
    description: "For professionals and small teams",
    plan: SubscriptionPlan.PRO,
    price: 19,
    priceId: process.env.STRIPE_PRO_MONTHLY_PLAN_ID || null,
    popular: true,
    features: {
      maxForms: -1, // unlimited
      maxResponsesPerForm: -1, // unlimited
      maxTeamMembers: 5,
      customBranding: true,
      webhooks: true,
      apiAccess: true,
      prioritySupport: false,
      paymentCollection: true,
      maxStorageBytes: 5 * 1024 * 1024 * 1024, // 5 GB
      fileRetentionDays: null, // unlimited
    },
  },
  BUSINESS: {
    name: "Business",
    description: "For growing businesses",
    plan: SubscriptionPlan.BUSINESS,
    price: 49,
    priceId: process.env.STRIPE_BUSINESS_MONTHLY_PLAN_ID || null,
    features: {
      maxForms: -1, // unlimited
      maxResponsesPerForm: -1, // unlimited
      maxTeamMembers: -1, // unlimited
      customBranding: true,
      webhooks: true,
      apiAccess: true,
      prioritySupport: true,
      paymentCollection: true,
      maxStorageBytes: 10 * 1024 * 1024 * 1024, // 10 GB
      fileRetentionDays: null, // unlimited
    },
  },
};

export function getPlanByPriceId(priceId: string): PlanConfig | undefined {
  return Object.values(PLANS).find((p) => p.priceId === priceId);
}

export function getFeatureLimitDisplay(value: number): string {
  return value === -1 ? "Unlimited" : String(value);
}
