import { Resend } from "resend";

import { env } from "@/env.mjs";

let _resend: Resend | null = null;

export function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!_resend) {
    _resend = new Resend(env.RESEND_API_KEY);
  }
  return _resend;
}

/**
 * Returns the verified "from" address for sending emails via Resend.
 * 
 * **IMPORTANT**: Resend's onboarding@resend.dev domain is a sandbox that only delivers
 * to verified recipients (typically just your account owner email). To send emails to
 * arbitrary users (e.g., form submitters), you MUST configure a verified production domain:
 * 
 * 1. Add your domain to Resend: https://resend.com/domains
 * 2. Set RESEND_FROM="GudForm <noreply@yourdomain.com>" in your environment
 * 
 * Without RESEND_FROM configured, auto-responder emails will silently fail for most recipients.
 * 
 * @returns Configured from address, or falls back to onboarding@resend.dev (sandbox only)
 */
export function getEmailFrom(): string {
  if (env.RESEND_FROM) {
    return env.RESEND_FROM;
  }
  
  // Fallback to sandbox domain - only delivers to verified emails
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[Email] Using Resend sandbox domain (onboarding@resend.dev). " +
      "Set RESEND_FROM to send to arbitrary recipients."
    );
  }
  
  return "GudForm <onboarding@resend.dev>";
}

/** @deprecated Use getResend() — kept for existing imports. */
export const resend = {
  emails: {
    send: async (...args: Parameters<Resend["emails"]["send"]>) => {
      const client = getResend();
      if (!client) {
        throw new Error("Email is not configured");
      }
      return client.emails.send(...args);
    },
  },
};
