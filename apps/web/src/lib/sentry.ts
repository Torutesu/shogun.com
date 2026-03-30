// =============================================================================
// SHOGUN Web — Sentry Error Monitoring (lightweight, optional)
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sentryClient: any = null;

/**
 * Initialize Sentry for Next.js. No-op if NEXT_PUBLIC_SENTRY_DSN is not set
 * or if the @sentry/nextjs package is not installed.
 */
export async function initSentry(): Promise<void> {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  try {
    // Dynamic import — gracefully fails if @sentry/nextjs is not installed
    const Sentry = await (Function('return import("@sentry/nextjs")')() as Promise<any>);
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? "development",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
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
