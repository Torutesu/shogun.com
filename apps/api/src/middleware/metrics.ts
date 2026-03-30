import type { MiddlewareHandler } from "hono";
import { incrementCounter, observeHistogram } from "../routes/metrics";

/**
 * Middleware that tracks HTTP request count and duration for Prometheus.
 */
export const metricsMiddleware: MiddlewareHandler = async (c, next) => {
  const start = performance.now();
  await next();
  const duration = (performance.now() - start) / 1000; // seconds

  const method = c.req.method;
  // Normalize path to avoid high-cardinality labels (strip IDs)
  const path = c.req.routePath ?? c.req.path.replace(/\/[a-f0-9-]{36}/g, "/:id");
  const status = String(c.res.status);

  incrementCounter("http_requests_total", { method, path, status });
  observeHistogram("http_request_duration_seconds", { method, path }, duration);
};
