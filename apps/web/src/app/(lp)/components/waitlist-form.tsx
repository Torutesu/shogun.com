"use client";

import { useState } from "react";
import type { Locale } from "@shogun/shared/types";
import { t } from "@shogun/shared/i18n";

interface WaitlistFormProps {
  locale: Locale;
  variant?: "hero" | "bottom";
}

export default function WaitlistForm({ locale, variant = "hero" }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isDark = variant === "hero" || variant === "bottom";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === "loading") return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || "Failed to join waitlist");
      }

      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "success") {
    return (
      <div className="flex items-center justify-center gap-2 py-3">
        <span className="inline-block w-2 h-2 rounded-full bg-gold" />
        <p className={`font-body text-sm ${isDark ? "text-dark-text" : "text-light-text"}`}>
          {t(locale, "lp.waitlist.success")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-[480px] mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t(locale, "lp.waitlist.placeholder")}
        className={`h-12 w-full sm:flex-1 px-4 font-body text-sm rounded-none border transition-colors outline-none ${
          isDark
            ? "bg-dark-surface border-dark-border text-dark-text placeholder:text-dark-text-dim focus:border-gold"
            : "bg-light-surface border-light-border text-light-text placeholder:text-light-text-dim focus:border-gold-dark"
        }`}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="h-12 px-8 bg-gold text-dark font-body font-medium text-sm tracking-wide rounded-none hover:bg-gold-dark transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer"
      >
        {status === "loading"
          ? t(locale, "common.loading")
          : t(locale, "lp.waitlist.cta")}
      </button>
      {status === "error" && (
        <p className="w-full text-center sm:text-left font-body text-xs text-red-400 mt-1">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
