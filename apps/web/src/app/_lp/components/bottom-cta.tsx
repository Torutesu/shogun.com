import type { Locale } from "@shogun/shared/types";
import { t } from "@shogun/shared/i18n";
import WaitlistForm from "./waitlist-form";

interface BottomCtaProps {
  locale: Locale;
}

export default function BottomCta({ locale }: BottomCtaProps) {
  return (
    <section className="bg-dark py-28 md:py-36 px-6">
      <div className="mx-auto max-w-[1200px] text-center">
        {/* Title */}
        <h2
          className="font-display tracking-[0.04em] text-dark-text leading-[1.05]"
          style={{
            fontSize: "clamp(2.5rem, 6vw, 5rem)",
          }}
        >
          {t(locale, "lp.bottomCta.title")}
        </h2>

        <p className="mt-4 font-body font-light text-xl text-dark-text-muted">
          {t(locale, "lp.bottomCta.subtitle")}
        </p>

        {/* Waitlist */}
        <div className="mt-12">
          <WaitlistForm locale={locale} variant="bottom" />
        </div>

        {/* Note */}
        <p className="mt-8 font-mono text-[0.6rem] tracking-[0.15em] uppercase text-dark-text-dim">
          {t(locale, "lp.bottomCta.note")}
        </p>
      </div>
    </section>
  );
}
