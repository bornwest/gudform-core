"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";
import {
  generateVerificationToken,
  sendVerificationEmail,
} from "@/lib/tokens";
import { isEmailConfigured } from "@/lib/mailer";
import { acceptInviteForUser } from "@/actions/team-actions";

export async function register(values: {
  name: string;
  email: string;
  password: string;
  inviteToken?: string;
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

  const inviteToken = values.inviteToken?.trim() || undefined;
  if (inviteToken) {
    const preview = await prisma.teamInvite.findUnique({
      where: { token: inviteToken },
    });
    if (!preview) {
      return { error: "This invitation is invalid or has already been used." };
    }
    if (preview.email.toLowerCase() !== normalizedEmail) {
      return {
        error: `This invitation was sent to ${preview.email}. Register with that email.`,
      };
    }
  }

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

  let teamId: string | undefined;
  if (inviteToken) {
    try {
      teamId = await acceptInviteForUser(
        newUser.id,
        normalizedEmail,
        inviteToken,
      );
    } catch (error) {
      await prisma.user.delete({ where: { id: newUser.id } });
      return {
        error:
          error instanceof Error
            ? error.message
            : "Could not join the team from this invitation.",
      };
    }

    await prisma.user.update({
      where: { id: newUser.id },
      data: { emailVerified: new Date() },
    });

    return {
      success: "Account created. You have joined the team.",
      autoVerified: true,
      teamId,
    };
  }

  if (isEmailConfigured()) {
    const verificationToken = await generateVerificationToken(normalizedEmail);
    const sent = await sendVerificationEmail(
      normalizedEmail,
      name,
      verificationToken.token,
    );
    if (!sent.ok) {
      // Preview DBs are separate from production and often cannot send mail
      // (wrong Resend domain on the API key). Unlock the account so the
      // hosted preview can still be walked. Production keeps the verify gate.
      if (process.env.VERCEL_ENV === "preview") {
        await prisma.user.update({
          where: { id: newUser.id },
          data: { emailVerified: new Date() },
        });
        return {
          success:
            "Account created. Verification email could not be sent on this preview, so you can sign in now.",
          autoVerified: true,
        };
      }
      return {
        error:
          sent.error ||
          "Account created, but the verification email could not be sent. Try again in a few minutes.",
      };
    }
    return { success: "Verification email sent! Check your inbox." };
  }

  await prisma.user.update({
    where: { id: newUser.id },
    data: { emailVerified: new Date() },
  });

  return {
    success: "Account created. You can sign in now.",
    autoVerified: true,
  };
}
