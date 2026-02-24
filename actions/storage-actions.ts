"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function getStorageUsage() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const [agg, fileCount] = await Promise.all([
    prisma.fileUpload.aggregate({
      where: { userId: user.id },
      _sum: { fileSize: true },
    }),
    prisma.fileUpload.count({ where: { userId: user.id } }),
  ]);

  const totalBytes = agg._sum.fileSize ?? 0;

  return {
    totalBytes,
    fileCount,
    maxBytes: -1, // unlimited
    retentionDays: null, // no expiration
    plan: "SELF_HOSTED",
    planName: "Self-Hosted",
    usagePercent: 0,
  };
}
