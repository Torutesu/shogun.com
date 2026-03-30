"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="mx-auto max-w-md rounded-[10px] border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card p-8 text-center">
        <h2
          className="mb-2 text-2xl tracking-wide text-light-text dark:text-dark-text"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Something went wrong
        </h2>
        <p className="mb-6 text-sm text-light-text-muted dark:text-dark-text-muted">
          An unexpected error occurred. Please try again.
        </p>
        {error.digest && (
          <p className="mb-4 font-mono text-[0.65rem] text-light-text-dim dark:text-dark-text-dim">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="rounded-none bg-gold px-6 py-2 text-sm font-medium text-dark transition-opacity hover:opacity-90 cursor-pointer"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
