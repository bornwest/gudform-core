"use server";

import { OSS_PLAN_FEATURES, isOssEdition } from "@/config/edition";
import { prisma } from "@/lib/db";
import { COUNTABLE_RESPONSE_WHERE } from "@/lib/response-counts";
import { PLANS, PlanConfig, SubscriptionPlan } from "@/config/subscriptions";
import { saasPrisma } from "@/lib/saas-prisma";

const OSS_PLAN_CONFIG: PlanConfig = {
  name: "Self-hosted",
  description: "All core features unlocked for self-hosting",
  plan: SubscriptionPlan.FREE,
  price: 0,
  priceId: null,
  features: OSS_PLAN_FEATURES,
};

export async function getEffectivePlanConfig(userId: string): Promise<PlanConfig> {
  if (isOssEdition()) {
    return OSS_PLAN_CONFIG;
  }
  const plan = await getUserPlan(userId);
  return PLANS[plan];
}

export async function getUserPlan(userId: string): Promise<SubscriptionPlan> {
  if (isOssEdition()) return SubscriptionPlan.FREE;

  const sub = await saasPrisma().subscription.findUnique({
    where: { userId },
  });
  return sub?.plan || SubscriptionPlan.FREE;
}

export async function getUserSubscription(userId: string) {
  if (isOssEdition()) return null;
  return saasPrisma().subscription.findUnique({
    where: { userId },
  });
}

export async function checkFormLimit(userId: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
}> {
  const config = await getEffectivePlanConfig(userId);
  const limit = config.features.maxForms;

  if (limit === -1) return { allowed: true, current: 0, limit: -1 };

  const count = await prisma.form.count({
    where: { userId },
  });

  return { allowed: count < limit, current: count, limit };
}

export async function checkResponseLimit(formId: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
}> {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: { userId: true },
  });

  if (!form) return { allowed: false, current: 0, limit: 0 };

  const config = await getEffectivePlanConfig(form.userId);
  const limit = config.features.maxResponsesPerForm;

  if (limit === -1) return { allowed: true, current: 0, limit: -1 };

  const count = await prisma.formResponse.count({
    where: { formId, ...COUNTABLE_RESPONSE_WHERE },
  });

  return { allowed: count < limit, current: count, limit };
}

export async function checkPaymentCollectionAccess(
  userId: string,
): Promise<boolean> {
  const config = await getEffectivePlanConfig(userId);
  return config.features.paymentCollection;
}

export async function checkStorageLimit(
  userId: string,
  additionalBytes: number,
): Promise<{
  allowed: boolean;
  currentBytes: number;
  limitBytes: number;
}> {
  const config = await getEffectivePlanConfig(userId);
  const limitBytes = config.features.maxStorageBytes;

  if (limitBytes === -1)
    return { allowed: true, currentBytes: 0, limitBytes: -1 };

  const result = await prisma.fileUpload.aggregate({
    where: { userId },
    _sum: { fileSize: true },
  });

  const currentBytes = result._sum.fileSize ?? 0;

  return {
    allowed: currentBytes + additionalBytes <= limitBytes,
    currentBytes,
    limitBytes,
  };
}

export async function getUsageStats(userId: string) {
  const plan = await getUserPlan(userId);
  const config = isOssEdition()
    ? OSS_PLAN_CONFIG
    : PLANS[plan];

  const [formCount, totalResponses, storageAgg, storageFileCount] =
    await Promise.all([
      prisma.form.count({ where: { userId } }),
      prisma.formResponse.count({
        where: { form: { userId }, completedAt: { not: null } },
      }),
      prisma.fileUpload.aggregate({
        where: { userId },
        _sum: { fileSize: true },
      }),
      prisma.fileUpload.count({ where: { userId } }),
    ]);

  return {
    plan,
    planConfig: config,
    formCount,
    totalResponses,
    formLimit: config.features.maxForms,
    responseLimitPerForm: config.features.maxResponsesPerForm,
    storageBytesUsed: storageAgg._sum.fileSize ?? 0,
    storageFileCount,
    storageMaxBytes: config.features.maxStorageBytes,
    storageRetentionDays: config.features.fileRetentionDays,
  };
}
