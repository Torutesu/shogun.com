"use client";

import { useState, useEffect } from "react";
import { cn } from "@shogun/ui";
import type { AIModel } from "@shogun/shared/types";
import { MODEL_CONFIGS } from "@shogun/shared/constants";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";

interface HeaderProps {
  title: string;
  showModelSelector?: boolean;
  selectedModel?: AIModel;
  onModelChange?: (model: AIModel) => void;
}

const locales = [
  { code: "en", label: "EN" },
  { code: "ja", label: "JA" },
  { code: "es", label: "ES" },
] as const;

export function Header({ title, showModelSelector, selectedModel, onModelChange }: HeaderProps) {
  const [locale, setLocale] = useState<string>("en");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("shogun_theme") as "light" | "dark") ?? "light";
    }
    return "light";
  });

  useEffect(() => {
    localStorage.setItem("shogun_theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card px-4 md:px-6">
      {/* Page title */}
      <h1
        className="text-lg tracking-wide text-light-text dark:text-dark-text md:pl-0 pl-10"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h1>

      <div className="flex-1" />

      {/* Model selector */}
      {showModelSelector && selectedModel && onModelChange && (
        <Dropdown
          align="right"
          trigger={
            <span className="inline-flex items-center gap-1.5 rounded-md border border-light-border dark:border-dark-border px-2.5 py-1 text-xs font-mono text-light-text-muted dark:text-dark-text-muted hover:border-gold/50 transition-colors">
              {MODEL_CONFIGS[selectedModel]?.name ?? selectedModel}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          }
        >
          {Object.values(MODEL_CONFIGS).map((m) => (
            <DropdownItem
              key={m.id}
              onClick={() => onModelChange(m.id)}
              className={cn(m.id === selectedModel && "text-gold")}
            >
              <span className="flex-1">{m.name}</span>
              <span className="text-[0.6rem] font-mono text-light-text-dim dark:text-dark-text-dim">
                {m.provider}
              </span>
            </DropdownItem>
          ))}
        </Dropdown>
      )}

      {/* Language switcher */}
      <div className="flex items-center rounded-md border border-light-border dark:border-dark-border text-xs">
        {locales.map((l, i) => (
          <button
            key={l.code}
            onClick={() => setLocale(l.code)}
            className={cn(
              "px-2 py-1 font-mono text-[0.65rem] uppercase tracking-wider transition-colors cursor-pointer",
              locale === l.code
                ? "bg-gold/15 text-gold"
                : "text-light-text-muted dark:text-dark-text-muted hover:text-light-text dark:hover:text-dark-text",
              i > 0 && "border-l border-light-border dark:border-dark-border",
            )}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="rounded-md p-1.5 text-light-text-muted dark:text-dark-text-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-surface dark:hover:bg-dark-surface transition-colors cursor-pointer"
        title={theme === "light" ? "Switch to dark" : "Switch to light"}
      >
        {theme === "light" ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </button>
    </header>
  );
}
