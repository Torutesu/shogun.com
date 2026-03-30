import { createMiddleware } from "hono/factory";
import { TIER_CONFIGS, type SubscriptionTier } from "@shogun/shared";
import type { AuthVariables } from "./auth";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const rateLimitMiddleware = createMiddleware<{ Variables: AuthVariables & { tier: SubscriptionTier } }>(
  async (c, next) => {
    const userId = c.get("userId");
    if (!userId) {
      return await next();
    }

    const tier = c.get("tier") ?? "free";
    const config = TIER_CONFIGS[tier];
    const limit = config.rateLimitPerMin;

    const now = Date.now();
    const windowMs = 60_000;
    const key = `rl:${userId}`;

    let entry = store.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    c.header("X-RateLimit-Limit", String(limit));
    c.header("X-RateLimit-Remaining", String(Math.max(0, limit - entry.count)));
    c.header("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > limit) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      c.header("Retry-After", String(retryAfter));
      return c.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: `Rate limit exceeded. Try again in ${retryAfter}s.`,
            status: 429,
          },
        },
        429,
      );
    }

    await next();
  },
);
