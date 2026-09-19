import { env } from "@/env.mjs";

export function isEmailConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY);
}
