export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-light dark:bg-dark">
      <div className="text-center">
        <h1
          className="text-light-text dark:text-dark-text tracking-[0.12em] animate-pulse"
          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(3rem, 10vw, 6rem)" }}
        >
          SHOGUN
        </h1>
      </div>
    </main>
  );
}
