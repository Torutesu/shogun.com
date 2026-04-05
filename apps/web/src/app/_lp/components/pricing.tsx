"use client";

import { useState } from "react";
import type { Locale } from "@shogun/shared/types";
import { t } from "@shogun/shared/i18n";
import { PLAN, ANNUAL_SAVINGS_USD } from "@shogun/shared/constants";
import Link from "next/link";

interface PricingProps {
  locale: Locale;
}

export default function Pricing({ locale }: PricingProps) {
  const [isAnnual, setIsAnnual] = useState(true);
  const price = isAnnual ? PLAN.priceAnnualUsd : PLAN.priceMonthlyUsd;

  return (
    <section id="pricing" className="bg-light-surface py-28 md:py-36 px-6">
      <div className="mx-auto max-w-[1200px]">
        {/* Title */}
        <div className="text-center mb-16">
          <h2
            className="font-display tracking-[0.04em] text-light-text leading-[1.05]"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
          >
            {t(locale, "lp.pricing.title")}
          </h2>
          <p className="mt-4 font-body font-light text-light-text-muted text-base">
            {t(locale, "lp.pricing.subtitle")}
          </p>
        </div>

        {/* Main pricing card */}
        <div className="mx-auto max-w-[600px]">
          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <button
              onClick={() => setIsAnnual(false)}
              className={`font-body text-sm px-4 py-2 rounded-sm transition-colors cursor-pointer ${
                !isAnnual
                  ? "bg-light-text text-light font-medium"
                  : "text-light-text-muted hover:text-light-text"
              }`}
            >
              {t(locale, "lp.pricing.plan.monthlyNote")}
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`font-body text-sm px-4 py-2 rounded-sm transition-colors cursor-pointer ${
                isAnnual
                  ? "bg-light-text text-light font-medium"
                  : "text-light-text-muted hover:text-light-text"
              }`}
            >
              {t(locale, "lp.pricing.plan.annualNote")}
            </button>
          </div>

          {/* Card */}
          <div className="relative bg-light-card rounded-lg border border-gold shadow-[0_0_0_1px_rgba(200,169,110,0.3)] p-10">
            {/* Save badge (annual only) */}
            {isAnnual && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-dark font-mono text-[0.6rem] tracking-[0.15em] uppercase px-3 py-1 rounded-sm">
                {t(locale, "lp.pricing.plan.annualSave")}
              </span>
            )}

            {/* Plan name */}
            <p className="font-mono text-[0.62rem] tracking-[0.2em] uppercase text-light-text-muted mb-2">
              {t(locale, "lp.pricing.plan.name")}
            </p>

            {/* Price */}
            <div className="mb-2">
              <span className="font-display text-5xl tracking-wide text-light-text">
                ${price}
              </span>
              <span className="ml-1 font-body text-sm text-light-text-muted">
                /mo
              </span>
            </div>

            {/* Description */}
            <p className="font-body font-light text-[0.85rem] text-light-text-muted leading-relaxed mb-8">
              {t(locale, "lp.pricing.plan.description")}
            </p>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <li key={n} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 mt-1.5 w-1 h-1 rounded-full bg-gold-dark" />
                  <span className="font-body font-light text-[0.85rem] text-light-text-muted leading-snug">
                    {t(locale, `lp.pricing.plan.feature${n}` as any)}
                  </span>
                </li>
              ))}
            </ul>

            {/* BYOK note */}
            <p className="mb-6 font-mono text-[0.6rem] tracking-[0.1em] text-light-text-dim border-t border-light-border pt-4">
              {t(locale, "lp.pricing.plan.byokNote")}
            </p>

            {/* CTA */}
            <Link
              href="/signup"
              className="block text-center h-12 leading-[3rem] font-body font-medium text-sm rounded-none bg-gold text-dark hover:bg-gold-dark transition-colors"
            >
              {t(locale, "lp.pricing.plan.cta")}
            </Link>
          </div>

          {/* Team card */}
          <div className="mt-6 bg-light-card rounded-lg border border-light-border p-8 text-center">
            <p className="font-mono text-[0.62rem] tracking-[0.2em] uppercase text-light-text-muted mb-2">
              {t(locale, "lp.pricing.team.title")}
            </p>
            <p className="font-body font-light text-sm text-light-text-muted mb-4">
              {t(locale, "lp.pricing.team.description")}
            </p>
            <span className="inline-block font-mono text-[0.6rem] tracking-[0.15em] uppercase text-gold-dark border border-gold-dark/30 px-3 py-1 rounded-sm">
              {t(locale, "lp.pricing.team.cta")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
