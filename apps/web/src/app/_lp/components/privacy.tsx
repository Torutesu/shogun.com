import type { Locale } from "@shogun/shared/types";
import { t } from "@shogun/shared/i18n";

interface PrivacyProps {
  locale: Locale;
}

const bulletKeys = [
  "privacy.textOnly",
  "privacy.encrypted",
  "privacy.noTraining",
  "privacy.deleteAnytime",
  "privacy.excludeApps",
  "privacy.youOwnIt",
] as const;

export default function Privacy({ locale }: PrivacyProps) {
  return (
    <section
      id="privacy"
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
          {t(locale, "privacy.title")}
        </h2>

        {/* Body */}
        <p className="mt-6 font-body font-light text-[clamp(0.95rem,1.5vw,1.1rem)] text-light-text-muted leading-[1.7] max-w-2xl">
          {t(locale, "privacy.body")}
        </p>

        {/* Bullets */}
        <ul className="lp-animate mt-12 grid gap-4 sm:grid-cols-2 max-w-2xl">
          {bulletKeys.map((key) => (
            <li key={key} className="flex items-start gap-3">
              {/* Checkmark */}
              <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="text-gold-dark"
                >
                  <path
                    d="M2.5 6L5 8.5L9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="font-body font-light text-[0.9rem] text-light-text leading-[1.6]">
                {t(locale, key)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
