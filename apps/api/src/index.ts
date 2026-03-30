import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "https://syogun.com", "https://*.syogun.com"],
    credentials: true,
  }),
);

// Health check
app.get("/", (c) => c.json({ status: "ok", service: "shogun-api" }));

// Route groups will be added here:
// app.route("/auth", authRoutes);
// app.route("/profile", profileRoutes);
// app.route("/chat", chatRoutes);
// app.route("/machine", machineRoutes);
// app.route("/files", fileRoutes);
// app.route("/services", serviceRoutes);
// app.route("/automations", automationRoutes);
// app.route("/memory", memoryRoutes);
// app.route("/billing", billingRoutes);
// app.route("/keys", keyRoutes);
// app.route("/models", modelRoutes);
// app.route("/notifications", notificationRoutes);

const port = Number(process.env.PORT) || 3001;
serve({ fetch: app.fetch, port }, () => {
  console.warn(`SHOGUN API running on port ${port}`);
});

export default app;
