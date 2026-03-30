// =============================================================================
// SHOGUN Web — Sentry Error Monitoring (lightweight, optional)
// =============================================================================

let sentryClient: any = null;

/**
 * Initialize Sentry for Next.js. No-op if NEXT_PUBLIC_SENTRY_DSN is not set
 * or if the @sentry/nextjs package is not installed.
 */
export async function initSentry(): Promise<void> {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? "development",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      // Capture unhandled errors and promise rejections
      autoSessionTracking: true,
    });
    sentryClient = Sentry;
  } catch {
    // @sentry/nextjs not installed — silently skip
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

// Auto-init on module load (browser + server)
void initSentry();
