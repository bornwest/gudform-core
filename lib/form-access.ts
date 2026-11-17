import { Prisma } from "@prisma/client";

/**
 * Forms reach a team through collections assigned to it. The direct
 * `Form.teamId` link is legacy but still honoured.
 */
export function teamFormsWhere(teamId: string): Prisma.FormWhereInput {
  return {
    OR: [{ teamId }, { collection: { teams: { some: { teamId } } } }],
  };
}

/** Forms shared with a user through any team they belong to. */
export function sharedFormsWhere(userId: string): Prisma.FormWhereInput {
  const memberTeam = { members: { some: { userId } } };
  return {
    OR: [
      { team: memberTeam },
      { collection: { teams: { some: { team: memberTeam } } } },
    ],
  };
}

/** Forms a user can open and edit: their own plus those shared via teams. */
export function editableFormsWhere(userId: string): Prisma.FormWhereInput {
  return { OR: [{ userId }, sharedFormsWhere(userId)] };
}

/**
 * Other users' collections shared with any team the user belongs to, at any
 * role. Members can view them; only OWNER/ADMIN can file forms into them.
 */
export function sharedCollectionsWhere(
  userId: string,
): Prisma.CollectionWhereInput {
  return {
    userId: { not: userId },
    teams: { some: { team: { members: { some: { userId } } } } },
  };
}

/** Team roles that may use collections shared with their team. */
export const COLLECTION_MANAGER_ROLES = ["OWNER", "ADMIN"] as const;

/**
 * Collections a user may create forms in and move forms into: their own,
 * plus any collection shared with a team where they are OWNER or ADMIN.
 */
export function usableCollectionsWhere(
  userId: string,
): Prisma.CollectionWhereInput {
  return {
    OR: [
      { userId },
      {
        teams: {
          some: {
            team: {
              members: {
                some: { userId, role: { in: [...COLLECTION_MANAGER_ROLES] } },
              },
            },
          },
        },
      },
    ],
  };
}

export const OWNER_ONLY_FORM_FIELDS = [
  "redirectUrl",
  "notifyOnResponse",
  "webhookUrl",
  "webhookSecret",
  "autoResponderEnabled",
  "autoResponderSubject",
  "autoResponderMessage",
  "paymentEnabled",
  "paymentAmount",
  "paymentCurrency",
  "paymentDescription",
  "paymentOptions",
  "paymentSelectionMode",
] as const;
