export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-dark px-4">
      {/* Logo */}
      <div className="mb-8">
        <h1
          className="text-dark-text tracking-[0.12em] text-center"
          style={{ fontFamily: "var(--font-display)", fontSize: "3rem" }}
        >
          SHOGUN
        </h1>
        <p className="text-dark-text-muted text-center text-sm mt-1">
          The only AI that knows your work.
        </p>
      </div>

      {children}
    </div>
  );
}
