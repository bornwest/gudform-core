"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function getUserSettings() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      notifyResponses: true,
      notifyStorage: true,
      marketingEmails: true,
      createdAt: true,
    },
  });

  if (!dbUser) throw new Error("User not found");
  return dbUser;
}

export async function updateNotificationPreferences(data: {
  notifyResponses: boolean;
  notifyStorage: boolean;
  marketingEmails: boolean;
}) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      notifyResponses: data.notifyResponses,
      notifyStorage: data.notifyStorage,
      marketingEmails: data.marketingEmails,
    },
  });

  revalidatePath("/dashboard/settings");
  return { status: "success" };
}
