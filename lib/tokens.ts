"use server";

import { prisma } from "@/lib/db";
import { getEmailFrom, getResend } from "@/lib/email";
import { siteConfig } from "@/config/site";
import { env } from "@/env.mjs";
import MagicLinkEmail from "@/emails/magic-link-email";

export async function generateVerificationToken(email: string) {
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Delete any existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  const verificationToken = await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return verificationToken;
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string,
) {
  const client = getResend();
  if (!client) return;

  const verifyUrl = `${env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;

  const result = await client.emails.send({
    from: getEmailFrom(),
    to:
      process.env.NODE_ENV === "development" ? "delivered@resend.dev" : email,
    subject: `Verify your email for ${siteConfig.name}`,
    react: MagicLinkEmail({
      firstName: name,
      actionUrl: verifyUrl,
      mailType: "register",
      siteName: siteConfig.name,
    }),
  });

  if (result.error) {
    console.error("[email] verification send failed", result.error.message);
  }
}
