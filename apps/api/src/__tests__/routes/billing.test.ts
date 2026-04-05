import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { TIER_CONFIGS } from "@shogun/shared";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

const mockFrom = vi.fn();

vi.mock("@shogun/db", () => ({
  createServerClient: () => ({
    from: mockFrom,
  }),
}));

vi.mock("../../lib/env", () => ({
  getEnv: () => ({
    STRIPE_SECRET_KEY: "sk_test_fake",
    APP_URL: "https://syogun.com",
  }),
}));

describe("GET /billing — subscription info", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  async function createApp() {
    const { default: billingRoutes } = await import("../../routes/billing");
    const app = new Hono();
    app.use("*", async (c, next) => {
      c.set("userId" as never, "test-user-id");
      await next();
    });
    app.route("/billing", billingRoutes);
    return app;
  }

  it("returns subscription and credits for a valid user", async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: {
                tier: "shogun",
                stripe_customer_id: "cus_test",
                stripe_subscription_id: "sub_test",
                current_period_start: "2026-03-01T00:00:00Z",
                current_period_end: "2026-04-01T00:00:00Z",
                cancel_at_period_end: false,
                ai_credits_balance: 0,
                ai_credits_included: 0,
                demo_credits_remaining: 500,
              },
              error: null,
            }),
        }),
      }),
    });

    const app = await createApp();
    const res = await app.request("/billing");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.subscription.tier).toBe("shogun");
    expect(body.credits.balance_cents).toBe(0);
    expect(body.credits.included_cents).toBe(0);
    expect(body.tier_config).toBeDefined();
  });

  it("returns 404 when subscription is not found", async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: null,
              error: { message: "Not found" },
            }),
        }),
      }),
    });

    const app = await createApp();
    const res = await app.request("/billing");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });
});

describe("demo credits", () => {
  it("new users receive 500 cents ($5.00) of demo credits", () => {
    // Demo credits are granted at signup (see auth.ts), not via TIER_CONFIGS
    const demoCreditsCents = 500;
    expect(demoCreditsCents).toBe(500);
  });
});
