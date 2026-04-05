"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Locale } from "@shogun/shared/types";
import { t } from "@shogun/shared/i18n";

interface LPNavProps {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

export default function LPNav({ locale, onLocaleChange }: LPNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-dark/95 backdrop-blur-md border-b border-dark-border"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-[1200px] px-6 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link
          href="/"
          className="font-display text-2xl tracking-[0.15em] text-dark-text select-none"
        >
          SHOGUN
        </Link>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-6">
          {/* Language switcher */}
          <div className="flex items-center gap-1 font-mono text-[0.62rem] tracking-[0.2em] uppercase text-dark-text-muted">
            {(["en", "ja", "es"] as Locale[]).map((l, i) => (
              <span key={l} className="flex items-center">
                {i > 0 && <span className="mx-1.5 opacity-40">·</span>}
                <button
                  onClick={() => onLocaleChange(l)}
                  className={`transition-colors cursor-pointer ${
                    locale === l
                      ? "text-gold"
                      : "hover:text-dark-text"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              </span>
            ))}
          </div>

          <Link
            href="/login"
            className="font-body text-sm font-medium text-dark-text-muted hover:text-dark-text transition-colors"
          >
            {t(locale, "auth.login")}
          </Link>

          <Link
            href="/signup"
            className="inline-flex items-center justify-center h-10 px-5 bg-gold text-dark font-body font-medium text-sm rounded-none hover:bg-gold-dark transition-colors"
          >
            {t(locale, "common.cta.earlyAccess")}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 cursor-pointer p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span
            className={`block w-5 h-px bg-dark-text transition-transform duration-200 ${
              menuOpen ? "translate-y-[3.5px] rotate-45" : ""
            }`}
          />
          <span
            className={`block w-5 h-px bg-dark-text transition-opacity duration-200 ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-px bg-dark-text transition-transform duration-200 ${
              menuOpen ? "-translate-y-[3.5px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-dark/98 backdrop-blur-md border-t border-dark-border px-6 py-6 space-y-4">
          <div className="flex items-center gap-3 font-mono text-[0.62rem] tracking-[0.2em] uppercase text-dark-text-muted">
            {(["en", "ja", "es"] as Locale[]).map((l, i) => (
              <span key={l} className="flex items-center">
                {i > 0 && <span className="mx-1 opacity-40">·</span>}
                <button
                  onClick={() => {
                    onLocaleChange(l);
                    setMenuOpen(false);
                  }}
                  className={`cursor-pointer ${
                    locale === l ? "text-gold" : "hover:text-dark-text"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              </span>
            ))}
          </div>

          <Link
            href="/login"
            className="block font-body text-sm text-dark-text-muted hover:text-dark-text"
            onClick={() => setMenuOpen(false)}
          >
            {t(locale, "auth.login")}
          </Link>

          <Link
            href="/signup"
            className="block w-full text-center h-10 leading-10 bg-gold text-dark font-body font-medium text-sm"
            onClick={() => setMenuOpen(false)}
          >
            {t(locale, "common.cta.earlyAccess")}
          </Link>
        </div>
      )}
    </nav>
  );
}
