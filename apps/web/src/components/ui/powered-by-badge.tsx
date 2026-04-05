import Link from "next/link";

interface PoweredByBadgeProps {
  variant?: "light" | "dark";
  className?: string;
}

export function PoweredByBadge({ variant = "dark", className = "" }: PoweredByBadgeProps) {
  const isDark = variant === "dark";
  return (
    <Link
      href="https://syogun.com?ref=badge"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[0.6rem] font-mono tracking-[0.15em] uppercase transition-opacity hover:opacity-80 ${
        isDark
          ? "bg-[#111] text-[#C8A96E] border border-[#2A2A2A]"
          : "bg-white text-[#A07840] border border-[#E8E6E0]"
      } ${className}`}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <rect width="10" height="10" rx="1" fill="currentColor" fillOpacity="0.2" />
        <text x="5" y="7.5" textAnchor="middle" fill="currentColor" fontSize="6" fontFamily="monospace">将</text>
      </svg>
      Powered by SHOGUN
    </Link>
  );
}
