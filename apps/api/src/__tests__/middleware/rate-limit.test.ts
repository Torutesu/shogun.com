import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

describe("rateLimitMiddleware", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  async function createApp() {
    const { rateLimitMiddleware } = await import("../../middleware/rate-limit");
    const app = new Hono();
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
    expect(res.headers.get("X-RateLimit-Limit")).toBe("200");
    expect(res.headers.get("X-RateLimit-Remaining")).toBeTruthy();
    expect(res.headers.get("X-RateLimit-Reset")).toBeTruthy();
  });

  it("returns 429 when rate limit is exceeded", async () => {
    const { rateLimitMiddleware } = await import("../../middleware/rate-limit");
    const userId = "rate-limit-test-user";
    const app = new Hono();
    app.use("*", async (c, next) => {
      c.set("userId" as never, userId);
      await next();
    });
    app.use("*", rateLimitMiddleware);
    app.get("/test", (c) => c.json({ ok: true }));

    // Send 200 requests to hit the limit
    for (let i = 0; i < 200; i++) {
      await app.request("/test");
    }

    // The 201st request should be rate limited
    const res = await app.request("/test");
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });
});
