import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

// ---------------------------------------------------------------------------
// Mock dependencies before importing the module under test
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock("../../lib/env", () => ({
  getEnv: () => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  }),
}));

describe("authMiddleware", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
  });

  async function createApp() {
    const { authMiddleware } = await import("../../middleware/auth");
    const app = new Hono();
    app.use("*", authMiddleware);
    app.get("/protected", (c) => c.json({ ok: true }));
    return app;
  }

  it("returns 401 when Authorization header is missing", async () => {
    const app = await createApp();
    const res = await app.request("/protected");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 when Authorization header has no Bearer prefix", async () => {
    const app = await createApp();
    const res = await app.request("/protected", {
      headers: { Authorization: "Basic abc123" },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 when token is invalid (getUser fails)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid token" },
    });

    const app = await createApp();
    const res = await app.request("/protected", {
      headers: { Authorization: "Bearer invalid-token" },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
    expect(body.error.message).toContain("Invalid or expired");
  });

  it("passes through when token is valid", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const app = await createApp();
    const res = await app.request("/protected", {
      headers: { Authorization: "Bearer valid-token" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
