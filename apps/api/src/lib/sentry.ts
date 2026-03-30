// =============================================================================
// SHOGUN API — Sentry Error Monitoring (lightweight, optional)
// =============================================================================

let sentryClient: any = null;

/**
 * Initialize Sentry for the Hono API server. No-op if SENTRY_DSN is not set
 * or if the @sentry/node package is not installed.
 */
export async function initSentry(): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    const Sentry = await import("@sentry/node");
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? "development",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    });
    sentryClient = Sentry;
  } catch {
    // @sentry/node not installed — silently skip
  }
}

/**
 * Capture an exception with Sentry (if initialized).
 */
export function captureException(error: unknown): void {
  if (sentryClient?.captureException) {
    sentryClient.captureException(error);
  }
}

/**
 * Check whether Sentry has been initialized.
 */
export function isSentryInitialized(): boolean {
  return sentryClient !== null;
}

// Auto-init on module load
void initSentry();
