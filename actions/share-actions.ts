"use server";

import { Resend } from "resend";

import { prisma } from "@/lib/db";
import { escapeHtml } from "@/lib/html-escape";
import { getCurrentUser } from "@/lib/session";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendFormByEmail(
  formId: string,
  recipientEmails: string[],
  message?: string,
) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const form = await prisma.form.findFirst({
    where: { id: formId, userId: user.id },
  });
  if (!form) throw new Error("Form not found");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const formUrl = `${appUrl}/f/${form.slug}`;

  const safeName = escapeHtml(user.name || "Someone");
  const safeTitle = escapeHtml(form.title);
  const safeDescription = form.description ? escapeHtml(form.description) : "";
  const safeMessage = message ? escapeHtml(message) : "";

  const emailBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${safeName} invited you to fill out a form</h2>
      <p style="font-size: 18px; font-weight: 600;">${safeTitle}</p>
      ${safeDescription ? `<p style="color: #666;">${safeDescription}</p>` : ""}
      ${safeMessage ? `<p style="color: #444; border-left: 3px solid #6366f1; padding-left: 12px; margin: 16px 0;">${safeMessage}</p>` : ""}
      <a href="${formUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
        Open Form
      </a>
      <p style="color: #999; font-size: 12px; margin-top: 24px;">
        Sent via GudForm
      </p>
    </div>
  `;

  for (const email of recipientEmails) {
    await resend.emails.send({
      from: "GudForm <onboarding@resend.dev>",
      to: email,
      subject: `${user.name || "Someone"} invited you to fill out "${form.title}"`,
      html: emailBody,
    });
  }
}
