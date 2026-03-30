import { cn } from "@shogun/ui";
import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Override default padding */
  noPadding?: boolean;
}

export function Card({ className, noPadding, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border",
        !noPadding && "p-5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
