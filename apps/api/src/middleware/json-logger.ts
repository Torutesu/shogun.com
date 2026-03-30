import { createMiddleware } from "hono/factory";

/**
 * Structured JSON logger that replaces Hono's built-in text logger.
 * Emits one JSON line per request with timing, status, and identity info.
 */
export const jsonLogger = createMiddleware(async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  const log = {
    timestamp: new Date().toISOString(),
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration_ms: duration,
    request_id: c.get("requestId"),
    user_id: c.get("userId") ?? null,
  };
  console.log(JSON.stringify(log));
});
