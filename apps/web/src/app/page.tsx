export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-dark">
      <div className="text-center">
        <h1
          className="text-dark-text tracking-[0.12em]"
          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(5.5rem, 16vw, 14rem)" }}
        >
          SHOGUN
        </h1>
        <p className="text-dark-text-muted text-lg">
          The only AI that knows your work.
        </p>
      </div>
    </main>
  );
}
