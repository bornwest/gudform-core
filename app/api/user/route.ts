import { auth } from "@/auth";

import { prisma } from "@/lib/db";

export const DELETE = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const currentUser = req.auth.user;
  if (!currentUser) {
    return new Response("Invalid user", { status: 401 });
  }

  try {
    // Delete responses on the user's forms first; see deleteForm in
    // actions/form-actions.ts for why the cascade alone fails.
    await prisma.$transaction([
      prisma.formResponse.deleteMany({
        where: { form: { userId: currentUser.id } },
      }),
      prisma.user.delete({
        where: {
          id: currentUser.id,
        },
      }),
    ]);
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }

  return new Response("User deleted successfully!", { status: 200 });
});
