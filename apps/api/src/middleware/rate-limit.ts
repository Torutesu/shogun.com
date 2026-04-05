import { createMiddleware } from "hono/factory";
import type { AuthVariables } from "./auth";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Single plan = single rate limit (200 req/min)
const RATE_LIMIT_PER_MIN = 200;

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const rateLimitMiddleware = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const userId = c.get("userId");
    if (!userId) {
      return await next();
    }

    const limit = RATE_LIMIT_PER_MIN;
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
