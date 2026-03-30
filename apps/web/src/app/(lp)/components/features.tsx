import type { Locale } from "@shogun/shared/types";
import { t } from "@shogun/shared/i18n";

interface FeaturesProps {
  locale: Locale;
}

const pillars = [
  { num: "01", tagKey: "lp.features.memory.tag", titleKey: "lp.features.memory.title", bodyKey: "lp.features.memory.body" },
  { num: "02", tagKey: "lp.features.computer.tag", titleKey: "lp.features.computer.title", bodyKey: "lp.features.computer.body" },
  { num: "03", tagKey: "lp.features.command.tag", titleKey: "lp.features.command.title", bodyKey: "lp.features.command.body" },
] as const;

export default function Features({ locale }: FeaturesProps) {
  return (
    <section
      id="features"
      className="bg-light-surface py-28 md:py-36 px-6"
    >
      <div className="mx-auto max-w-[1200px]">
        {/* Section title */}
        <p className="font-mono text-[0.62rem] tracking-[0.2em] uppercase text-gold-dark mb-4">
          {t(locale, "lp.features.sectionTitle")}
        </p>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.num}
              className="lp-animate border-l-2 border-gold-dark bg-light-card rounded-lg p-8 md:p-10"
            >
              {/* Tag */}
              <p className="font-mono text-[0.62rem] tracking-[0.2em] uppercase text-light-text-muted mb-3">
                {pillar.num} {t(locale, pillar.tagKey)}
              </p>

              {/* Title */}
              <h3
                className="font-display tracking-[0.04em] text-light-text leading-[1.1] mb-4"
                style={{
                  fontSize: "clamp(1.8rem, 3vw, 2.5rem)",
                }}
              >
                {t(locale, pillar.titleKey)}
              </h3>

              {/* Body */}
              <p className="font-body font-light text-[0.9rem] text-light-text-muted leading-[1.7]">
                {t(locale, pillar.bodyKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
