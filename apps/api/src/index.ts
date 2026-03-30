import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { errorHandler } from "./middleware/error";
import { authMiddleware } from "./middleware/auth";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { machineGuard } from "./middleware/machine-guard";

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
import terminalRoutes from "./ws/terminal";

const app = new Hono();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use("*", logger());
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

// Mount sub-apps
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
