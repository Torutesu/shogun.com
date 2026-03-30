import { cn } from "@shogun/ui";
import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "gold" | "green" | "red" | "blue";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-light-surface dark:bg-dark-surface text-light-text-muted dark:text-dark-text-muted",
  gold: "bg-gold/15 text-gold-dark dark:text-gold",
  green: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  red: "bg-red-500/15 text-red-700 dark:text-red-400",
  blue: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
};

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-[0.2em]",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
