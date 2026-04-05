import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { errorHandler } from "./middleware/error";
import { requestIdMiddleware } from "./middleware/request-id";
import { metricsMiddleware } from "./middleware/metrics";
import { jsonLogger } from "./middleware/json-logger";
import { authMiddleware } from "./middleware/auth";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { machineGuard } from "./middleware/machine-guard";

import metricsRoutes from "./routes/metrics";
import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";
import chatRoutes from "./routes/chat";
import machineRoutes from "./routes/machine";
import fileRoutes from "./routes/files";
import memoryRoutes from "./routes/memory";
import billingRoutes from "./routes/billing";
import keyRoutes from "./routes/keys";
import modelRoutes from "./routes/models";
import serviceRoutes from "./routes/services";
import automationRoutes from "./routes/automations";
import notificationRoutes from "./routes/notifications";
import teamRoutes from "./routes/teams";
import teamSharingRoutes from "./routes/team-sharing";
import auditRoutes from "./routes/audit";
import ssoRoutes from "./routes/sso";
import terminalRoutes from "./ws/terminal";

const app = new Hono();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use("*", requestIdMiddleware);
app.use("*", metricsMiddleware);
app.use("*", jsonLogger);
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "https://syogun.com", "https://*.syogun.com"],
    credentials: true,
  }),
);
app.onError(errorHandler);

// ---------------------------------------------------------------------------
// Health check (no auth)
// ---------------------------------------------------------------------------
app.get("/", (c) => c.json({ status: "ok", service: "shogun-api" }));
app.get("/health", (c) => c.json({ status: "ok" }));

// ---------------------------------------------------------------------------
// Prometheus metrics (no auth — for scraping)
// ---------------------------------------------------------------------------
app.route("/metrics", metricsRoutes);

// ---------------------------------------------------------------------------
// Public routes (no auth required)
// ---------------------------------------------------------------------------
app.route("/auth", authRoutes);

// Stripe webhook — validates its own signature, no JWT auth needed
app.post("/billing/webhook", async (c) => {
  // Delegate to the billing route's webhook handler
  return billingRoutes.fetch(
    new Request(new URL("/webhook", c.req.url), {
      method: "POST",
      headers: c.req.raw.headers,
      body: c.req.raw.body,
    }),
  );
});

// ---------------------------------------------------------------------------
// Authenticated routes
// ---------------------------------------------------------------------------
const authed = new Hono();
authed.use("*", authMiddleware);
authed.use("*", rateLimitMiddleware);

authed.route("/profile", profileRoutes);
authed.route("/chat", chatRoutes);
authed.route("/machine", machineRoutes);
authed.route("/memory", memoryRoutes);
authed.route("/billing", billingRoutes);
authed.route("/keys", keyRoutes);
authed.route("/models", modelRoutes);
authed.route("/notifications", notificationRoutes);
authed.route("/teams", teamRoutes);
authed.route("/teams", teamSharingRoutes);
authed.route("/teams", auditRoutes);
authed.route("/sso", ssoRoutes);
authed.route("/terminal", terminalRoutes);

// ---------------------------------------------------------------------------
// Authenticated routes that also require a running machine
// ---------------------------------------------------------------------------
const machineAuthed = new Hono();
machineAuthed.use("*", authMiddleware);
machineAuthed.use("*", rateLimitMiddleware);
machineAuthed.use("*", machineGuard);

machineAuthed.route("/files", fileRoutes);
machineAuthed.route("/services", serviceRoutes);
machineAuthed.route("/automations", automationRoutes);

// ---------------------------------------------------------------------------
// API Versioning
// ---------------------------------------------------------------------------
// All routes are mounted under /v1/ for forward-compatible versioning.
// When v2 is introduced, create a separate Hono sub-app and mount at /v2.
// Unversioned paths receive a deprecation warning header.
// ---------------------------------------------------------------------------

// Mount under /v1
app.route("/v1", authed);
app.route("/v1", machineAuthed);
app.route("/v1/auth", authRoutes);
app.route("/v1/billing/webhook", billingRoutes);

// Deprecation middleware for unversioned paths — adds a warning header
// so clients know to migrate to /v1/.
app.use("*", async (c, next) => {
  const path = c.req.path;
  if (path !== "/" && !path.startsWith("/v1") && !path.startsWith("/auth") && !path.startsWith("/billing/webhook")) {
    c.header("Deprecation", "true");
    c.header("Sunset", "2027-01-01");
    c.header("X-API-Warn", "Unversioned API paths are deprecated. Use /v1/ prefix.");
  }
  await next();
});

// Legacy unversioned mounts (keep working, but warn)
app.route("/", authed);
app.route("/", machineAuthed);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const port = Number(process.env.PORT) || 3001;
serve({ fetch: app.fetch, port }, () => {
  console.warn(`SHOGUN API running on port ${port}`);
});

export default app;
