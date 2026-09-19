import { getEmailFrom, getResend } from "@/lib/email";
import { escapeHtml } from "@/lib/html-escape";
import { env } from "@/env.mjs";
import { siteConfig } from "@/config/site";
import { isEmailConfigured } from "@/lib/mailer";

export async function sendTeamInviteEmail(opts: {
  to: string;
  teamName: string;
  inviterName: string;
  token: string;
}): Promise<boolean> {
  if (!isEmailConfigured()) return false;

  const client = getResend();
  if (!client) return false;

  const inviteUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "")}/invite/${opts.token}`;
  const safeTeam = escapeHtml(opts.teamName);
  const safeInviter = escapeHtml(opts.inviterName);
  const safeUrl = escapeHtml(inviteUrl);

  await client.emails.send({
    from: getEmailFrom(),
    to:
      process.env.NODE_ENV === "development"
        ? "delivered@resend.dev"
        : opts.to,
    subject: `You're invited to join ${opts.teamName} on ${siteConfig.name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
        <h2 style="margin-bottom: 8px;">Join ${safeTeam} on ${escapeHtml(siteConfig.name)}</h2>
        <p>${safeInviter} invited you to collaborate on forms with this team.</p>
        <p>
          <a href="${safeUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Accept invitation
          </a>
        </p>
        <p style="color: #444; font-size: 14px; line-height: 1.5;">
          <strong>How to join</strong>
        </p>
        <ol style="color: #444; font-size: 14px; line-height: 1.6; padding-left: 20px;">
          <li>Open the link above (this email was sent to <strong>${escapeHtml(opts.to)}</strong>).</li>
          <li>If you do not have an account yet, create one with <strong>this same email</strong> and a password.</li>
          <li>If you already have an account, sign in with that email.</li>
          <li>After you join, open <strong>Dashboard → Teams</strong> to find <strong>${safeTeam}</strong>.</li>
        </ol>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          This invitation expires in 7 days. If you were not expecting it, you can ignore this email.
        </p>
      </div>
    `,
  });

  return true;
}
