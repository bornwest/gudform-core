import crypto from "crypto";

import { prisma } from "@/lib/db";

function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function authenticateApiKey(
  request: Request,
): Promise<{ userId: string } | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const key = authHeader.substring(7);
  if (!key.startsWith("ff_")) return null;

  const hashedKey = hashApiKey(key);

  const apiKey = await prisma.apiKey.findUnique({
    where: { hashedKey },
    select: { id: true, userId: true },
  });

  if (!apiKey) return null;

  // Update last used timestamp (fire-and-forget)
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  return { userId: apiKey.userId };
}
