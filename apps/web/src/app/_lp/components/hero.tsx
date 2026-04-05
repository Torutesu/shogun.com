import type { Locale } from "@shogun/shared/types";
import { t } from "@shogun/shared/i18n";
import Link from "next/link";

interface HeroProps {
  locale: Locale;
}

export default function Hero({ locale }: HeroProps) {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center bg-dark overflow-hidden px-6"
    >
      {/* Kanji watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        aria-hidden="true"
      >
        <span
          className="font-display text-[clamp(20rem,50vw,50rem)] leading-none text-transparent"
          style={{
            WebkitTextStroke: "1px rgba(240, 237, 230, 0.06)",
          }}
        >
          将軍
        </span>
      </div>

      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(200,169,110,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-[1200px] mx-auto">
        {/* Eyebrow */}
        <p className="font-mono text-[0.62rem] tracking-[0.2em] uppercase text-gold mb-8">
          {t(locale, "lp.hero.eyebrow")}
        </p>

        {/* Title */}
        <h1
          className="font-display tracking-[0.12em] text-dark-text leading-[0.9]"
          style={{
            fontSize: "clamp(5.5rem, 16vw, 14rem)",
          }}
        >
          SHO<span className="text-gold">G</span>UN
        </h1>

        {/* Animated gold accent line */}
        <div className="mx-auto mt-4 h-px w-24 overflow-hidden">
          <div
            className="h-full w-full animate-pulse"
            style={{
              background: "linear-gradient(90deg, transparent, #C8A96E, transparent)",
            }}
          />
        </div>

        {/* Tagline */}
        <p className="mt-6 font-body font-light text-[clamp(1rem,2.5vw,1.25rem)] text-dark-text leading-relaxed max-w-2xl mx-auto">
          {t(locale, "lp.hero.tagline")}
        </p>

        {/* Subtitle */}
        <p className="mt-2 font-body font-light text-[clamp(0.9rem,2vw,1.05rem)] text-dark-text-muted leading-relaxed max-w-xl mx-auto">
          {t(locale, "lp.hero.subtitle")}
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center h-14 px-10 bg-gold text-dark font-body font-semibold text-base tracking-wide rounded-none hover:bg-gold-dark transition-colors"
          >
            {t(locale, "common.cta.earlyAccess")}
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center h-14 px-10 border border-dark-border-bright text-dark-text font-body font-medium text-sm tracking-wide rounded-none hover:border-dark-text-muted transition-colors"
          >
            {t(locale, "common.cta.howItWorks")}
          </a>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 flex items-center justify-center gap-6 font-mono text-[0.55rem] tracking-[0.15em] uppercase text-dark-text-dim">
          <span>14-day free trial</span>
          <span className="w-1 h-1 rounded-full bg-dark-text-dim" />
          <span>No credit card required</span>
          <span className="w-1 h-1 rounded-full bg-dark-text-dim" />
          <span>BYOK — bring your own AI keys</span>
        </div>

        {/* Bottom note */}
        <p className="mt-16 font-mono text-[0.6rem] tracking-[0.15em] uppercase text-dark-text-dim">
          {t(locale, "lp.hero.bottomNote")}
        </p>
      </div>
    </section>
  );
}
