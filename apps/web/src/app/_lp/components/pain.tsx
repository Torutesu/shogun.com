import type { Locale } from "@shogun/shared/types";
import { t } from "@shogun/shared/i18n";

interface PainProps {
  locale: Locale;
}

export default function Pain({ locale }: PainProps) {
  const quotes = [
    t(locale, "lp.pain.quote1"),
    t(locale, "lp.pain.quote2"),
    t(locale, "lp.pain.quote3"),
  ];

  return (
    <section
      id="pain"
      className="bg-light py-28 md:py-36 px-6"
    >
      <div className="mx-auto max-w-[1200px]">
        {/* Title */}
        <h2
          className="lp-animate font-display tracking-[0.04em] text-light-text leading-[1.05] max-w-3xl"
          style={{
            fontSize: "clamp(2.5rem, 6vw, 5rem)",
          }}
        >
          {t(locale, "lp.pain.title")}
        </h2>

        {/* Quotes */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {quotes.map((quote, i) => (
            <div
              key={i}
              className="lp-animate relative bg-light-card border border-light-border rounded-lg p-8"
            >
              <span
                className="absolute top-4 left-5 font-display text-6xl text-gold/20 leading-none select-none"
                aria-hidden="true"
              >
                &ldquo;
              </span>
              <p className="relative z-10 pt-6 font-body font-light text-light-text-muted text-base leading-relaxed italic">
                &ldquo;{quote}&rdquo;
              </p>
            </div>
          ))}
        </div>

        {/* Body */}
        <p className="lp-animate mt-14 font-body font-light text-[clamp(0.95rem,1.5vw,1.1rem)] text-light-text leading-[1.7] max-w-2xl">
          {t(locale, "lp.pain.body")}
        </p>
      </div>
    </section>
  );
}
