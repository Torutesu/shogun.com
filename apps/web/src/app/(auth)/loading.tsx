export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-dark">
      <div className="flex flex-col items-center gap-3">
        <h1
          className="text-dark-text tracking-[0.12em] animate-pulse"
          style={{ fontFamily: "var(--font-display)", fontSize: "3rem" }}
        >
          SHOGUN
        </h1>
      </div>
    </div>
  );
}
