"use server";

import crypto from "crypto";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

function generateApiKey(): string {
  return `ff_${crypto.randomBytes(32).toString("hex")}`;
}

function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function createApiKey(name: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const key = generateApiKey();

  const apiKey = await prisma.apiKey.create({
    data: {
      userId: user.id,
      name,
      hashedKey: hashApiKey(key),
      keyPrefix: key.substring(0, 7),
    },
  });

  revalidatePath("/dashboard/settings/api-keys");

  // Return the full key only on creation — it won't be shown again
  return { id: apiKey.id, name: apiKey.name, key };
}

export async function listApiKeys() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const keys = await prisma.apiKey.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return keys.map((k) => ({
    ...k,
    maskedKey: `${k.keyPrefix}...${"****"}`,
  }));
}

export async function deleteApiKey(id: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  await prisma.apiKey.deleteMany({
    where: { id, userId: user.id },
  });

  revalidatePath("/dashboard/settings/api-keys");
}

export async function rotateApiKey(id: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const newKey = generateApiKey();

  const updated = await prisma.apiKey.updateMany({
    where: { id, userId: user.id },
    data: {
      hashedKey: hashApiKey(newKey),
      keyPrefix: newKey.substring(0, 7),
      key: null,
    },
  });

  if (updated.count === 0) throw new Error("API key not found");

  revalidatePath("/dashboard/settings/api-keys");

  return { key: newKey };
}
