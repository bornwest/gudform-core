"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getEffectivePlanConfig } from "@/lib/subscription";

export async function getStorageUsage() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const config = await getEffectivePlanConfig(user.id);
  const plan = config.plan;

  const [agg, fileCount] = await Promise.all([
    prisma.fileUpload.aggregate({
      where: { userId: user.id },
      _sum: { fileSize: true },
    }),
    prisma.fileUpload.count({ where: { userId: user.id } }),
  ]);

  const totalBytes = agg._sum.fileSize ?? 0;
  const maxBytes = config.features.maxStorageBytes;
  const usagePercent = maxBytes === -1 ? 0 : Math.round((totalBytes / maxBytes) * 100);

  return {
    totalBytes,
    fileCount,
    maxBytes,
    retentionDays: config.features.fileRetentionDays,
    plan,
    planName: config.name,
    usagePercent,
  };
}
