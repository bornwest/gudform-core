"use server";

import { prisma } from "@/lib/db";

/**
 * Ensures a user has a default collection. If none exists,
 * creates one and assigns all unassigned forms to it.
 * Returns the default collection.
 */
export async function ensureDefaultCollection(userId: string) {
  // Check for existing default
  let defaultCollection = await prisma.collection.findFirst({
    where: { userId, isDefault: true },
  });

  if (defaultCollection) return defaultCollection;

  // No collections at all — create default and assign orphaned forms
  defaultCollection = await prisma.collection.create({
    data: {
      name: "Default",
      userId,
      isDefault: true,
    },
  });

  // Assign any forms without a collection to this default
  await prisma.form.updateMany({
    where: {
      userId,
      collectionId: null,
    },
    data: {
      collectionId: defaultCollection.id,
    },
  });

  return defaultCollection;
}
