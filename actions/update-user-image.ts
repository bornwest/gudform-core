"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { validateHttpsUrl } from "@/lib/url-validation";
import { userImageSchema } from "@/lib/validations/user";

export type FormData = {
  image: string;
};

type UpdateUserImageResult = {
  status: "success" | "error";
  error?: string;
};

export async function updateUserImage(
  userId: string,
  data: FormData,
): Promise<UpdateUserImageResult> {
  try {
    const session = await auth();

    if (!session?.user || session?.user.id !== userId) {
      throw new Error("Unauthorized");
    }

    const { image } = userImageSchema.parse(data);

    // An empty value clears the photo and falls back to the initials avatar.
    if (image !== "") {
      const { valid, error } = validateHttpsUrl(image);
      if (!valid) {
        return { status: "error", error };
      }
    }

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        image: image === "" ? null : image,
      },
    });

    revalidatePath("/dashboard/settings");
    return { status: "success" };
  } catch (error) {
    return { status: "error" };
  }
}
