import type { Locale } from "@shogun/shared/types";
import { t } from "@shogun/shared/i18n";
import WaitlistForm from "./waitlist-form";

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
              background:
                "linear-gradient(90deg, transparent, #C8A96E, transparent)",
            }}
          />
        </div>

        {/* Tagline */}
        <p className="mt-6 font-body font-light text-[clamp(1rem,2.5vw,1.25rem)] text-dark-text leading-relaxed">
          {t(locale, "lp.hero.tagline")}
        </p>

        {/* Subtitle */}
        <p className="mt-2 font-body font-light text-[clamp(0.9rem,2vw,1.05rem)] text-dark-text-muted leading-relaxed">
          {t(locale, "lp.hero.subtitle")}
        </p>

        {/* Waitlist */}
        <div className="mt-10">
          <WaitlistForm locale={locale} variant="hero" />
        </div>

        {/* Secondary CTA */}
        <div className="mt-4">
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center h-10 px-6 text-dark-text-muted font-body text-sm tracking-wide hover:text-dark-text transition-colors"
          >
            {t(locale, "common.cta.howItWorks")}
          </a>
        </div>

        {/* Bottom note */}
        <p className="mt-20 font-mono text-[0.6rem] tracking-[0.15em] uppercase text-dark-text-dim">
          {t(locale, "lp.hero.bottomNote")}
        </p>
      </div>
    </section>
  );
}
