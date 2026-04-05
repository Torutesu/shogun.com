import type { Locale } from "@shogun/shared/types";
import { t } from "@shogun/shared/i18n";

interface HowItWorksProps {
  locale: Locale;
}

const steps = [
  { titleKey: "lp.howItWorks.step1.title", bodyKey: "lp.howItWorks.step1.body" },
  { titleKey: "lp.howItWorks.step2.title", bodyKey: "lp.howItWorks.step2.body" },
  { titleKey: "lp.howItWorks.step3.title", bodyKey: "lp.howItWorks.step3.body" },
  { titleKey: "lp.howItWorks.step4.title", bodyKey: "lp.howItWorks.step4.body" },
] as const;

export default function HowItWorks({ locale }: HowItWorksProps) {
  return (
    <section
      id="how-it-works"
      className="bg-dark-surface py-28 md:py-36 px-6"
    >
      <div className="mx-auto max-w-[1200px]">
        {/* Title */}
        <h2
          className="font-display tracking-[0.04em] text-dark-text leading-[1.05] mb-20"
          style={{
            fontSize: "clamp(2.5rem, 6vw, 5rem)",
          }}
        >
          {t(locale, "lp.howItWorks.title")}
        </h2>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-dark-border"
            aria-hidden="true"
          />

          <div className="space-y-16">
            {steps.map((step, i) => (
              <div key={i} className="lp-animate relative flex gap-8 md:gap-12">
                {/* Number */}
                <div className="relative z-10 flex-shrink-0 w-12 md:w-16 h-12 md:h-16 flex items-center justify-center">
                  <span className="font-display text-3xl md:text-4xl text-gold leading-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Content */}
                <div className="pt-1 md:pt-3">
                  <h3 className="font-display text-xl md:text-2xl tracking-[0.04em] text-dark-text leading-tight mb-2">
                    {t(locale, step.titleKey)}
                  </h3>
                  <p className="font-body font-light text-[0.9rem] text-dark-text-muted leading-[1.7] max-w-lg">
                    {t(locale, step.bodyKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
