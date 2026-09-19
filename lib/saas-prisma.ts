import { prisma } from "@/lib/db";

/**
 * Hosted-only Prisma models (subscriptions, marketplace). The OSS schema
 * export removes those tables. Call only when `isSaasEdition()` is true.
 */
export function saasPrisma(): any {
  return prisma;
}
