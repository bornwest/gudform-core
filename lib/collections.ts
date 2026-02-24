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

/**
 * Returns form IDs accessible to a user via their team memberships.
 * A team member can access forms in collections assigned to their team
 * (via CollectionTeam) or all forms if the team has `accessAllCollections`.
 */
export async function getAccessibleFormIdsForTeamMember(
  userId: string,
): Promise<string[]> {
  // Get all teams the user is a member of
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: {
      team: {
        select: {
          id: true,
          accessAllCollections: true,
          collectionTeams: {
            select: {
              collection: {
                select: {
                  forms: {
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const formIdSet = new Set<string>();
  const accessAllTeamIds: string[] = [];

  for (const membership of memberships) {
    const team = membership.team;

    if (team.accessAllCollections) {
      accessAllTeamIds.push(team.id);
    } else {
      // Team only has access to forms in assigned collections
      for (const ct of team.collectionTeams) {
        for (const form of ct.collection.forms) {
          formIdSet.add(form.id);
        }
      }
    }
  }

  // Batch all "access all collections" teams into a single query
  if (accessAllTeamIds.length > 0) {
    const teamForms = await prisma.form.findMany({
      where: {
        OR: [
          { teamId: { in: accessAllTeamIds } },
          {
            collection: {
              teams: { some: { teamId: { in: accessAllTeamIds } } },
            },
          },
        ],
      },
      select: { id: true },
    });
    for (const f of teamForms) {
      formIdSet.add(f.id);
    }
  }

  return Array.from(formIdSet);
}
