import type { Prisma } from "@prisma/client";

/** Responses that consume the form's response limit. Drafts do not. */
export const COUNTABLE_RESPONSE_WHERE: Prisma.FormResponseWhereInput = {
  OR: [{ completedAt: { not: null } }, { paymentStatus: { not: null } }],
};
