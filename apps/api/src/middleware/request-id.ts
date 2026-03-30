import { createMiddleware } from "hono/factory";

export type RequestIdVariables = {
  requestId: string;
};

/**
 * Generates a unique request ID for each incoming request.
 * Sets the ID on both the response header and context variable.
 */
export const requestIdMiddleware = createMiddleware<{ Variables: RequestIdVariables }>(
  async (c, next) => {
    const id = crypto.randomUUID();
    c.set("requestId", id);
    c.header("X-Request-ID", id);
    await next();
  },
);
