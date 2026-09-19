import { isOssEdition } from "@/config/edition";
import { getUserPlan } from "@/lib/subscription";

export const API_RATE_WINDOW_MS = 60_000;

/** Requests allowed per API key per minute. */
export async function getApiRateLimitPerMinute(userId: string): Promise<number> {
  if (isOssEdition()) return 1000;

  const plan = await getUserPlan(userId);
  switch (plan) {
    case "BUSINESS":
      return 500;
    case "PRO":
      return 100;
    case "STARTER":
      return 60;
    default:
      return 30;
  }
}
