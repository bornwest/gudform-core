"use server";

import { prisma } from "@/lib/db";
import { SELF_HOSTED_PLAN } from "@/config/subscriptions";

export async function getUserPlan(_userId: string) {
  return "SELF_HOSTED" as const;
}

export async function getUserSubscription(_userId: string) {
  return null;
}

export async function checkFormLimit(_userId: string) {
  return { allowed: true, current: 0, limit: -1 };
}

export async function checkResponseLimit(_formId: string) {
  return { allowed: true, current: 0, limit: -1 };
}

export async function checkPaymentCollectionAccess(_userId: string) {
  return true;
}

export async function checkStorageLimit(
  _userId: string,
  _additionalBytes: number,
) {
  return { allowed: true, currentBytes: 0, limitBytes: -1 };
}

export async function getUsageStats(userId: string) {
  const config = SELF_HOSTED_PLAN;

  const [formCount, totalResponses, storageAgg, storageFileCount] =
    await Promise.all([
      prisma.form.count({ where: { userId } }),
      prisma.formResponse.count({ where: { form: { userId } } }),
      prisma.fileUpload.aggregate({
        where: { userId },
        _sum: { fileSize: true },
      }),
      prisma.fileUpload.count({ where: { userId } }),
    ]);

  return {
    plan: "SELF_HOSTED",
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
