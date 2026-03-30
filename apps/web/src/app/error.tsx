"use client";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#080808] text-[#F0EDE6]">
        <div className="mx-auto max-w-md rounded-[10px] border border-[#1E1E1E] bg-[#111111] p-8 text-center">
          <h2
            className="mb-2 text-2xl tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Something went wrong
          </h2>
          <p className="mb-6 text-sm text-[#F0EDE6]/60">
            An unexpected error occurred. Please try again.
          </p>
          {error.digest && (
            <p className="mb-4 font-mono text-[0.65rem] text-[#F0EDE6]/30">
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            className="rounded-none bg-[#C8A96E] px-6 py-2 text-sm font-medium text-[#080808] transition-opacity hover:opacity-90 cursor-pointer"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
