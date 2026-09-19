"use server";

import { prisma } from "@/lib/db";
import { getAppOrigin } from "@/lib/app-origin";
import { getEmailFrom, getResend } from "@/lib/email";
import { siteConfig } from "@/config/site";
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
): Promise<{ ok: boolean; error?: string }> {
  const client = getResend();
  if (!client) return { ok: false, error: "Email is not configured" };

  const verifyUrl = `${await getAppOrigin()}/api/auth/verify-email?token=${token}`;

  const payload = {
    to:
      process.env.NODE_ENV === "development" ? "delivered@resend.dev" : email,
    subject: `Verify your email for ${siteConfig.name}`,
    react: MagicLinkEmail({
      firstName: name,
      actionUrl: verifyUrl,
      mailType: "register",
      siteName: siteConfig.name,
    }),
  };

  let result = await client.emails.send({
    from: getEmailFrom(),
    ...payload,
  });

  if (
    result.error &&
    /not authorized to send/i.test(result.error.message || "")
  ) {
    console.error(
      "[email] RESEND_FROM rejected; retrying Resend sandbox from",
      result.error.message,
    );
    result = await client.emails.send({
      from: "GudForm <onboarding@resend.dev>",
      ...payload,
    });
  }

  if (result.error) {
    console.error("[email] verification send failed", result.error.message);
    return { ok: false, error: result.error.message };
  }

  console.info("[email] verification sent", result.data?.id ?? "ok");
  return { ok: true };
}
