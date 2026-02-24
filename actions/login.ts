"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";

export async function login(values: { email: string; password: string }) {
  const validatedFields = loginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const { email, password } = validatedFields.data;
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { emailVerified: true, password: true },
  });

  if (!user || !user.password) {
    return { error: "Invalid email or password." };
  }

  if (!user.emailVerified) {
    return { error: "Please verify your email before signing in." };
  }

  try {
    await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirect: false,
    });

    return { success: "Logged in!" };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password." };
        default:
          return { error: "Something went wrong." };
      }
    }
    throw error;
  }
}
