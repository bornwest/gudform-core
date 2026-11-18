import { prisma } from "@/lib/db";
import { ownedFormsWhere } from "@/lib/form-access";

/** True when the user is the form's primary owner or an OWNER/ADMIN of a team it is shared with. */
export async function isFormOwner(
  form: { id: string; userId: string },
  userId: string,
): Promise<boolean> {
  if (form.userId === userId) return true;
  const count = await prisma.form.count({
    where: { id: form.id, ...ownedFormsWhere(userId) },
  });
  return count > 0;
}

/** Finds a form the user owns (primary or team admin), or null. */
export function findOwnedForm(formId: string, userId: string) {
  return prisma.form.findFirst({
    where: { id: formId, ...ownedFormsWhere(userId) },
  });
}
