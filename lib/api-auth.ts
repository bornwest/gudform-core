import crypto from "crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { API_RATE_WINDOW_MS, getApiRateLimitPerMinute } from "@/config/api-limits";
import { rateLimit } from "@/lib/rate-limit";

function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

const apiKeyLimiter = rateLimit({
  interval: API_RATE_WINDOW_MS,
  uniqueTokenPerInterval: 10_000,
});

export type ApiAuth = { userId: string; apiKeyId: string };

export async function authenticateApiKey(
  request: Request,
): Promise<ApiAuth | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const key = authHeader.substring(7);
  if (!key.startsWith("ff_")) return null;

  const hashedKey = hashApiKey(key);

  const apiKey = await prisma.apiKey.findUnique({
    where: { hashedKey },
    select: { id: true, userId: true },
  });

  if (!apiKey) return null;

  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  return { userId: apiKey.userId, apiKeyId: apiKey.id };
}

export async function authorizeApiRequest(
  request: Request,
): Promise<{ ok: true; auth: ApiAuth } | { ok: false; response: NextResponse }> {
  const auth = await authenticateApiKey(request);
  if (!auth) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const limit = await getApiRateLimitPerMinute(auth.userId);
  const result = apiKeyLimiter.check(limit, auth.apiKeyId);
  if (!result.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Too many requests", code: "RATE_LIMITED" },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": "0",
          },
        },
      ),
    };
  }

  return { ok: true, auth };
}
