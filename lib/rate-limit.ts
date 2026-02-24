/**
 * In-memory sliding window rate limiter.
 * Suitable for single-server deployments.
 */

interface RateLimitResult {
  success: boolean;
  remaining: number;
}

export function rateLimit({
  interval,
  uniqueTokenPerInterval = 500,
}: {
  interval: number;
  uniqueTokenPerInterval?: number;
}) {
  const tokenCache = new Map<string, number[]>();

  // Periodically clean up expired entries
  setInterval(() => {
    const now = Date.now();
    tokenCache.forEach((timestamps, token) => {
      const valid = timestamps.filter((t) => t > now - interval);
      if (valid.length === 0) {
        tokenCache.delete(token);
      } else {
        tokenCache.set(token, valid);
      }
    });
    // Evict oldest entries if map grows too large
    if (tokenCache.size > uniqueTokenPerInterval) {
      const entries = Array.from(tokenCache.entries());
      entries
        .sort((a, b) => Math.max(...a[1]) - Math.max(...b[1]))
        .slice(0, entries.length - uniqueTokenPerInterval)
        .forEach(([key]) => tokenCache.delete(key));
    }
  }, interval).unref();

  return {
    check(limit: number, token: string): RateLimitResult {
      const now = Date.now();
      const timestamps = tokenCache.get(token) ?? [];
      const valid = timestamps.filter((t) => t > now - interval);
      if (valid.length >= limit) {
        return { success: false, remaining: 0 };
      }
      valid.push(now);
      tokenCache.set(token, valid);
      return { success: true, remaining: limit - valid.length };
    },
  };
}
