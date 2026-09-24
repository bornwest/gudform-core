"use server";

import { revalidatePath } from "next/cache";

import { ensureDefaultCollection } from "@/lib/collections";
import { prisma } from "@/lib/db";
import { COUNTABLE_RESPONSE_WHERE } from "@/lib/response-counts";
import { getCurrentUser } from "@/lib/session";

// ─── List ────────────────────────────────────────────────────────────────────

export async function getUserCollections() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  // Lazy init — ensure default collection exists
  await ensureDefaultCollection(user.id);

  return prisma.collection.findMany({
    where: {
      OR: [
        { userId: user.id },
        {
          teams: { some: { team: { members: { some: { userId: user.id } } } } },
        },
      ],
    },
    include: {
      _count: {
        select: { forms: true, teams: true },
      },
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

// ─── Get by ID ───────────────────────────────────────────────────────────────

export async function getCollectionById(collectionId: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  return prisma.collection.findFirst({
    where: {
      id: collectionId,
      OR: [
        { userId: user.id },
        {
          teams: { some: { team: { members: { some: { userId: user.id } } } } },
        },
      ],
    },
    include: {
      forms: {
        include: {
          _count: {
            select: {
              responses: { where: COUNTABLE_RESPONSE_WHERE },
              questions: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      },
      teams: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
              accessAllCollections: true,
              _count: { select: { members: true } },
            },
          },
        },
      },
      _count: { select: { forms: true, teams: true } },
    },
  });
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createCollection(name: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  if (!name.trim()) throw new Error("Collection name is required");

  const collection = await prisma.collection.create({
    data: {
      name: name.trim(),
      userId: user.id,
      isDefault: false,
    },
  });

  revalidatePath("/dashboard/collections");
  revalidatePath("/dashboard");
  return collection;
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateCollection(collectionId: string, name: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId: user.id },
  });
  if (!collection) throw new Error("Collection not found");
  if (collection.isDefault) throw new Error("Cannot rename default collection");

  const updated = await prisma.collection.update({
    where: { id: collectionId },
    data: { name: name.trim() },
  });

  revalidatePath("/dashboard/collections");
  revalidatePath(`/dashboard/collections/${collectionId}`);
  return updated;
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteCollection(collectionId: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId: user.id },
  });
  if (!collection) throw new Error("Collection not found");
  if (collection.isDefault) throw new Error("Cannot delete default collection");

  // Move orphaned forms back to default collection
  const defaultCollection = await ensureDefaultCollection(user.id);

  await prisma.form.updateMany({
    where: { collectionId },
    data: { collectionId: defaultCollection.id },
  });

  await prisma.collection.delete({
    where: { id: collectionId },
  });

  revalidatePath("/dashboard/collections");
  revalidatePath("/dashboard");
}

// ─── Move Form ───────────────────────────────────────────────────────────────

export async function moveFormToCollection(
  formId: string,
  collectionId: string,
) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  // Validate ownership of both form and collection
  const form = await prisma.form.findFirst({
    where: { id: formId, userId: user.id },
  });
  if (!form) throw new Error("Form not found");

  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId: user.id },
  });
  if (!collection) throw new Error("Collection not found");

  await prisma.form.update({
    where: { id: formId },
    data: { collectionId },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/collections");
  revalidatePath(`/dashboard/collections/${collectionId}`);
  if (form.collectionId) {
    revalidatePath(`/dashboard/collections/${form.collectionId}`);
  }
}

// ─── Team Assignment ─────────────────────────────────────────────────────────

export async function assignTeamToCollection(
  collectionId: string,
  teamId: string,
) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  // Validate user owns the collection
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId: user.id },
  });
  if (!collection) throw new Error("Collection not found");

  // Validate user is OWNER or ADMIN of the team
  const membership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId: user.id,
      role: { in: ["OWNER", "ADMIN"] },
    },
  });
  if (!membership)
    throw new Error("You must be a team owner or admin to assign collections");

  // Create the link (upsert to avoid duplicates)
  await prisma.collectionTeam.upsert({
    where: {
      collectionId_teamId: { collectionId, teamId },
    },
    update: {},
    create: { collectionId, teamId },
  });

  revalidatePath(`/dashboard/collections/${collectionId}`);
}

export async function removeTeamFromCollection(
  collectionId: string,
  teamId: string,
) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  // Validate user owns the collection
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId: user.id },
  });
  if (!collection) throw new Error("Collection not found");

  await prisma.collectionTeam.deleteMany({
    where: { collectionId, teamId },
  });

  revalidatePath(`/dashboard/collections/${collectionId}`);
}

export async function toggleTeamAccessAllCollections(
  teamId: string,
  accessAll: boolean,
) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  // Validate user is OWNER or ADMIN of the team
  const membership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId: user.id,
      role: { in: ["OWNER", "ADMIN"] },
    },
  });
  if (!membership) throw new Error("You must be a team owner or admin");

  await prisma.team.update({
    where: { id: teamId },
    data: { accessAllCollections: accessAll },
  });

  revalidatePath("/dashboard/collections");
}
