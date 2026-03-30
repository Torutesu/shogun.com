import type { ErrorHandler } from "hono";
import { ZodError } from "zod";
import { captureException, isSentryInitialized } from "../lib/sentry";

export const errorHandler: ErrorHandler = (err, c) => {
  // Zod validation errors
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          status: 422,
          details,
        },
      },
      422,
    );
  }

  // Known application errors with status
  if ("status" in err && typeof (err as any).status === "number") {
    const status = (err as any).status as number;
    return c.json(
      {
        error: {
          code: (err as any).code ?? "ERROR",
          message: err.message || "An error occurred",
          status,
        },
      },
      status as any,
    );
  }

  // Unexpected errors
  console.error("Unhandled error:", err);
  if (isSentryInitialized()) {
    captureException(err);
  }
  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
        status: 500,
      },
    },
    500,
  );
};
