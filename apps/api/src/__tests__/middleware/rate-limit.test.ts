import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

vi.mock("@shogun/shared", async () => {
  const actual = await vi.importActual<typeof import("@shogun/shared")>("@shogun/shared");
  return {
    ...actual,
    TIER_CONFIGS: {
      ...actual.TIER_CONFIGS,
      free: { ...actual.TIER_CONFIGS.free, rateLimitPerMin: 3 }, // low limit for testing
    },
  };
});

vi.mock("@shogun/db", () => ({
  createServerClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { tier: "free" }, error: null }),
        }),
      }),
    }),
  }),
}));

describe("rateLimitMiddleware", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  async function createApp() {
    const { rateLimitMiddleware } = await import("../../middleware/rate-limit");
    const app = new Hono();
    // Simulate auth by setting userId
    app.use("*", async (c, next) => {
      c.set("userId" as never, "test-user-" + Math.random().toString(36).slice(2, 6));
      await next();
    });
    app.use("*", rateLimitMiddleware);
    app.get("/test", (c) => c.json({ ok: true }));
    return app;
  }

  it("allows requests under the limit", async () => {
    const app = await createApp();
    const res = await app.request("/test");
    expect(res.status).toBe(200);
  });

  it("sets rate limit headers", async () => {
    const app = await createApp();
    const res = await app.request("/test");
    expect(res.headers.get("X-RateLimit-Limit")).toBeTruthy();
    expect(res.headers.get("X-RateLimit-Remaining")).toBeTruthy();
    expect(res.headers.get("X-RateLimit-Reset")).toBeTruthy();
  });

  it("returns 429 when rate limit is exceeded", async () => {
    const app = await createApp();

    // Use a unique userId for all requests in this test
    const userId = "rate-limit-test-user";
    const appWithFixedUser = new Hono();
    const { rateLimitMiddleware } = await import("../../middleware/rate-limit");
    appWithFixedUser.use("*", async (c, next) => {
      c.set("userId" as never, userId);
      await next();
    });
    appWithFixedUser.use("*", rateLimitMiddleware);
    appWithFixedUser.get("/test", (c) => c.json({ ok: true }));

    // Send requests up to the limit (3) plus one more
    for (let i = 0; i < 3; i++) {
      const res = await appWithFixedUser.request("/test");
      expect(res.status).toBe(200);
    }

    // The 4th request should be rate limited
    const res = await appWithFixedUser.request("/test");
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });
});
