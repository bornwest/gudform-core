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
