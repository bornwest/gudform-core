"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ensureDefaultCollection } from "@/lib/collections";
import {
  ownedFormsWhere,
  sharedCollectionsWhere,
  usableCollectionsWhere,
} from "@/lib/form-access";
import { findOwnedForm } from "@/lib/form-ownership";
import { COUNTABLE_RESPONSE_WHERE } from "@/lib/response-counts";

// ─── List ────────────────────────────────────────────────────────────────────

export async function getUserCollections() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  // Lazy init — ensure default collection exists
  await ensureDefaultCollection(user.id);

  return prisma.collection.findMany({
    where: { userId: user.id },
    include: {
      _count: {
        select: { forms: true, teams: true },
      },
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

/**
 * Collections the user can create forms in or move forms into: their own,
 * plus collections shared with a team where they are OWNER or ADMIN.
 */
export async function getUsableCollections() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  await ensureDefaultCollection(user.id);

  const collections = await prisma.collection.findMany({
    where: usableCollectionsWhere(user.id),
    include: {
      user: { select: { name: true, email: true } },
      teams: { select: { team: { select: { name: true } } } },
      _count: { select: { forms: true } },
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return collections
    .map(({ user: owner, teams, ...collection }) => {
      const isOwn = collection.userId === user.id;
      return {
        ...collection,
        isOwn,
        // A shared collection may be another user's default; only the
        // viewer's own default should be labelled as such.
        isDefault: isOwn && collection.isDefault,
        ownerName: isOwn ? null : owner.name || owner.email || "Another user",
        teamNames: isOwn ? [] : teams.map((t) => t.team.name),
      };
    })
    .sort((a, b) => Number(b.isOwn) - Number(a.isOwn));
}

/** Other users' collections shared with the user through their teams. */
export async function getSharedCollections() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const collections = await prisma.collection.findMany({
    where: sharedCollectionsWhere(user.id),
    select: {
      id: true,
      name: true,
      user: { select: { name: true, email: true } },
      // Only the teams the viewer is on; other assignments are the owner's.
      teams: {
        where: { team: { members: { some: { userId: user.id } } } },
        select: { team: { select: { name: true } } },
      },
      _count: { select: { forms: true } },
    },
    orderBy: { name: "asc" },
  });

  return collections.map(({ user: owner, teams, ...collection }) => ({
    ...collection,
    ownerName: owner.name || owner.email || "Another user",
    teamNames: teams.map((t) => t.team.name),
  }));
}

// ─── Get by ID ───────────────────────────────────────────────────────────────

export async function getCollectionById(collectionId: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  // Owners get the full page; members of a team it is shared with get a
  // read-only view of its forms.
  const collection = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      OR: [{ userId: user.id }, sharedCollectionsWhere(user.id)],
    },
    include: {
      user: { select: { name: true, email: true } },
      forms: {
        include: {
          _count: { select: { responses: { where: COUNTABLE_RESPONSE_WHERE }, questions: true } },
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
  if (!collection) return null;

  const { user: owner, ...rest } = collection;
  const isOwner = collection.userId === user.id;

  // Team admins can file their own forms here, so the collection owner does
  // not necessarily own every form in it.
  const owned = await prisma.form.findMany({
    where: { collectionId, ...ownedFormsWhere(user.id) },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((f) => f.id));

  return {
    ...rest,
    isOwner,
    ownerName: isOwner ? null : owner.name || owner.email || "Another user",
    // Team assignments are managed by the owner only.
    teams: isOwner ? collection.teams : [],
    forms: collection.forms.map((form) => ({
      ...form,
      canMove: ownedIds.has(form.id),
      canDelete: form.userId === user.id,
    })),
  };
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
  if (collection.isDefault)
    throw new Error("Cannot delete default collection");

  // Move orphaned forms back to each form owner's default collection. Team
  // admins can file their own forms in a shared collection, so not every
  // form here belongs to the collection owner.
  const ownerIds = await prisma.form.findMany({
    where: { collectionId },
    select: { userId: true },
    distinct: ["userId"],
  });
  for (const { userId } of ownerIds) {
    const defaultCollection = await ensureDefaultCollection(userId);
    await prisma.form.updateMany({
      where: { collectionId, userId },
      data: { collectionId: defaultCollection.id },
    });
  }

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

  // The user must own the form (primary or team admin), and the target must be
  // their own collection or one shared with a team they own or admin.
  const form = await findOwnedForm(formId, user.id);
  if (!form) throw new Error("Form not found");

  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, ...usableCollectionsWhere(user.id) },
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
  if (!membership)
    throw new Error("You must be a team owner or admin");

  await prisma.team.update({
    where: { id: teamId },
    data: { accessAllCollections: accessAll },
  });

  revalidatePath("/dashboard/collections");
}
