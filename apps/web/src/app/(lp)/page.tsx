"use client";

import { useState, useEffect } from "react";
import { detectLocale } from "@shogun/shared/i18n";
import type { Locale } from "@shogun/shared/types";
import LPNav from "./components/lp-nav";
import Hero from "./components/hero";
import Pain from "./components/pain";
import Features from "./components/features";
import HowItWorks from "./components/how-it-works";
import Privacy from "./components/privacy";
import Pricing from "./components/pricing";
import BottomCta from "./components/bottom-cta";
import LPFooter from "./components/lp-footer";

export default function LandingPage() {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    // Detect locale from URL params, localStorage, or browser
    const params = new URLSearchParams(window.location.search);
    const detected = detectLocale(
      params.get("lang"),
      typeof navigator !== "undefined" ? navigator.language : null,
      typeof localStorage !== "undefined" ? localStorage.getItem("shogun-locale") : null
    );
    setLocale(detected);
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem("shogun-locale", newLocale);
    // Update URL without reload
    const url = new URL(window.location.href);
    url.searchParams.set("lang", newLocale);
    window.history.replaceState({}, "", url.toString());
  };

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("lp-visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );

    const elements = document.querySelectorAll(".lp-animate");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [locale]);

  return (
    <>
      <style>{`
        html { scroll-behavior: smooth; }

        .lp-animate {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease-out, transform 0.7s ease-out;
        }
        .lp-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Stagger children */
        .lp-animate:nth-child(2) { transition-delay: 0.1s; }
        .lp-animate:nth-child(3) { transition-delay: 0.2s; }
        .lp-animate:nth-child(4) { transition-delay: 0.3s; }
      `}</style>

      <LPNav locale={locale} onLocaleChange={handleLocaleChange} />

      <main>
        <Hero locale={locale} />
        <Pain locale={locale} />
        <Features locale={locale} />
        <HowItWorks locale={locale} />
        <Privacy locale={locale} />
        <Pricing locale={locale} />
        <BottomCta locale={locale} />
      </main>

      <LPFooter locale={locale} />
    </>
  );
}
