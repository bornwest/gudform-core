import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";

import { prisma } from "@/lib/db";
import { env } from "@/env.mjs";
import { getPlatformR2Client, getR2BucketName } from "@/lib/storage";

const BATCH_SIZE = 100;

export async function GET(req: NextRequest) {
  // Verify CRON_SECRET
  const authHeader = req.headers.get("authorization");
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let totalDeleted = 0;
    const s3 = getPlatformR2Client();
    const bucket = getR2BucketName();

    // Process expired files in batches
    while (true) {
      const expired = await prisma.fileUpload.findMany({
        where: { expiresAt: { lt: new Date() } },
        take: BATCH_SIZE,
        select: { id: true, key: true },
      });

      if (expired.length === 0) break;

      // Delete from R2
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: expired.map((f) => ({ Key: f.key })),
            Quiet: true,
          },
        }),
      );

      // Delete DB records
      await prisma.fileUpload.deleteMany({
        where: { id: { in: expired.map((f) => f.id) } },
      });

      totalDeleted += expired.length;

      if (expired.length < BATCH_SIZE) break;
    }

    return NextResponse.json({
      deleted: totalDeleted,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("File cleanup error:", error);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 },
    );
  }
}
