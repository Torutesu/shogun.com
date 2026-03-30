"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@shogun/ui";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium tracking-wide text-light-text-muted dark:text-dark-text-muted"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-10 w-full rounded-md border bg-transparent px-3 text-sm outline-none transition-colors",
            "border-light-border dark:border-dark-border",
            "text-light-text dark:text-dark-text",
            "placeholder:text-light-text-dim dark:placeholder:text-dark-text-dim",
            "focus:border-gold focus:ring-1 focus:ring-gold/30",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/30",
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
export { Input, type InputProps };
