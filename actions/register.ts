"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";
import {
  generateVerificationToken,
  sendVerificationEmail,
} from "@/lib/tokens";

export async function register(values: {
  name: string;
  email: string;
  password: string;
}) {
  const validatedFields = registerSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const { name, email, password } = validatedFields.data;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashedPassword,
    },
  });

  // Create default collection for the new user
  await prisma.collection.create({
    data: {
      name: "Default",
      userId: newUser.id,
      isDefault: true,
    },
  });

  const verificationToken = await generateVerificationToken(normalizedEmail);
  await sendVerificationEmail(normalizedEmail, name, verificationToken.token);

  return { success: "Verification email sent! Check your inbox." };
}
