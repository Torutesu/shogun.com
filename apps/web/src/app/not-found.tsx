export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-light dark:bg-dark">
      <div className="text-center">
        <h1
          className="text-light-text dark:text-dark-text tracking-[0.12em]"
          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(3rem, 10vw, 8rem)" }}
        >
          404
        </h1>
        <p className="mt-2 text-light-text-muted dark:text-dark-text-muted text-lg">
          Page not found
        </p>
        <a
          href="/"
          className="mt-6 inline-block bg-gold px-6 py-2.5 text-sm font-medium text-dark tracking-wide hover:bg-gold-dark transition-colors"
        >
          Back to SHOGUN
        </a>
      </div>
    </main>
  );
}
