import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { handleSchema, updateProfileSchema } from "@shogun/shared";

// ---------------------------------------------------------------------------
// Mock Supabase before importing the route module
// ---------------------------------------------------------------------------
const mockFrom = vi.fn();

vi.mock("@shogun/db", () => ({
  createServerClient: () => ({
    from: mockFrom,
  }),
}));

// We test the schemas directly and the route handler logic via Hono's test client
// to keep tests focused and avoid needing a real database.

describe("handle availability — schema validation", () => {
  it("rejects an invalid handle format", () => {
    const result = handleSchema.safeParse("AB!");
    expect(result.success).toBe(false);
  });

  it("rejects a reserved handle", () => {
    const result = handleSchema.safeParse("admin");
    expect(result.success).toBe(false);
  });

  it("accepts a valid handle", () => {
    const result = handleSchema.safeParse("takeshi");
    expect(result.success).toBe(true);
  });
});

describe("profile update — schema validation", () => {
  it("accepts valid profile update fields", () => {
    const result = updateProfileSchema.safeParse({
      display_name: "Takeshi",
      locale: "ja",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty update (all optional)", () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects an invalid locale", () => {
    const result = updateProfileSchema.safeParse({ locale: "fr" });
    expect(result.success).toBe(false);
  });

  it("rejects display_name exceeding max length", () => {
    const result = updateProfileSchema.safeParse({
      display_name: "x".repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

describe("GET /handle/:handle — route integration", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("returns available: true when handle is not taken", async () => {
    // Mock the Supabase query chain: from().select().eq().single()
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    });

    // Import the route lazily so mocks are in place
    const { default: profileRoutes } = await import("../../routes/profile");

    // Build a minimal app to test the route
    const app = new Hono();
    // Simulate auth middleware by setting userId
    app.use("*", async (c, next) => {
      c.set("userId" as never, "test-user-id");
      c.set("supabase" as never, { from: mockFrom });
      await next();
    });
    app.route("/profile", profileRoutes);

    const res = await app.request("/profile/handle/takeshi");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.available).toBe(true);
    expect(body.handle).toBe("takeshi");
  });

  it("returns available: false when handle is taken", async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { id: "other-user" }, error: null }),
        }),
      }),
    });

    const { default: profileRoutes } = await import("../../routes/profile");

    const app = new Hono();
    app.use("*", async (c, next) => {
      c.set("userId" as never, "test-user-id");
      c.set("supabase" as never, { from: mockFrom });
      await next();
    });
    app.route("/profile", profileRoutes);

    const res = await app.request("/profile/handle/takeshi");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.available).toBe(false);
  });

  it("returns available: false for invalid handle format", async () => {
    const { default: profileRoutes } = await import("../../routes/profile");

    const app = new Hono();
    app.use("*", async (c, next) => {
      c.set("userId" as never, "test-user-id");
      await next();
    });
    app.route("/profile", profileRoutes);

    const res = await app.request("/profile/handle/AB!");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.available).toBe(false);
    expect(body.reason).toBeDefined();
  });
});
