import type { Locale } from "@shogun/shared/types";
import type { SubscriptionTier } from "@shogun/shared/types";
import { t } from "@shogun/shared/i18n";
import { TIER_CONFIGS } from "@shogun/shared/constants";
import Link from "next/link";

interface PricingProps {
  locale: Locale;
}

const tiers: SubscriptionTier[] = ["free", "basic", "pro", "ultra"];

function formatMemory(mb: number): string {
  if (mb >= 1024) {
    const gb = mb / 1024;
    return gb >= 1 ? `${gb} GB` : `${mb} MB`;
  }
  return `${mb} MB`;
}

function formatPrice(locale: Locale, priceUsd: number, priceJpy: number): string {
  if (locale === "ja") {
    return priceJpy === 0 ? "0" : `${priceJpy.toLocaleString()}`;
  }
  return priceUsd === 0 ? "0" : `${priceUsd}`;
}

function currencySymbol(locale: Locale): string {
  return locale === "ja" ? "\u00a5" : "$";
}

function formatCredits(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function getTierDescKey(tier: SubscriptionTier) {
  const map = {
    free: "lp.pricing.free.description",
    basic: "lp.pricing.basic.description",
    pro: "lp.pricing.pro.description",
    ultra: "lp.pricing.ultra.description",
  } as const;
  return map[tier];
}

function getTierNameKey(tier: SubscriptionTier) {
  const map = {
    free: "tier.free",
    basic: "tier.basic",
    pro: "tier.pro",
    ultra: "tier.ultra",
  } as const;
  return map[tier];
}

export default function Pricing({ locale }: PricingProps) {
  return (
    <section
      id="pricing"
      className="bg-light-surface py-28 md:py-36 px-6"
    >
      <div className="mx-auto max-w-[1200px]">
        {/* Title */}
        <div className="text-center mb-16">
          <h2
            className="font-display tracking-[0.04em] text-light-text leading-[1.05]"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
            }}
          >
            {t(locale, "lp.pricing.title")}
          </h2>
          <p className="mt-4 font-body font-light text-light-text-muted text-base">
            {t(locale, "lp.pricing.subtitle")}
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => {
            const config = TIER_CONFIGS[tier];
            const isPopular = tier === "basic";
            const isFree = tier === "free";

            return (
              <div
                key={tier}
                className={`relative bg-light-card rounded-lg border p-8 flex flex-col ${
                  isPopular
                    ? "border-gold shadow-[0_0_0_1px_rgba(200,169,110,0.3)]"
                    : "border-light-border"
                }`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-dark font-mono text-[0.6rem] tracking-[0.15em] uppercase px-3 py-1 rounded-sm">
                    {t(locale, "lp.pricing.mostPopular")}
                  </span>
                )}

                {/* Tier name */}
                <p className="font-mono text-[0.62rem] tracking-[0.2em] uppercase text-light-text-muted mb-2">
                  {t(locale, getTierNameKey(tier))}
                </p>

                {/* Price */}
                <div className="mb-2">
                  <span className="font-display text-4xl tracking-wide text-light-text">
                    {isFree ? (
                      t(locale, "tier.free")
                    ) : (
                      <>
                        {currencySymbol(locale)}
                        {formatPrice(locale, config.priceUsd, config.priceJpy)}
                      </>
                    )}
                  </span>
                  {!isFree && (
                    <span className="ml-1 font-body text-sm text-light-text-muted">
                      {t(locale, "lp.pricing.monthly")}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="font-body font-light text-[0.85rem] text-light-text-muted leading-relaxed mb-6">
                  {t(locale, getTierDescKey(tier))}
                </p>

                {/* Features */}
                <ul className="space-y-2.5 mb-8 flex-1">
                  {config.creditsIncludedCents > 0 && (
                    <FeatureItem
                      text={t(locale, "lp.pricing.features.credits").replace(
                        "{amount}",
                        formatCredits(config.creditsIncludedCents)
                      )}
                    />
                  )}
                  <FeatureItem
                    text={t(locale, "lp.pricing.features.cpu").replace(
                      "{count}",
                      String(config.cpuCores)
                    )}
                  />
                  <FeatureItem
                    text={t(locale, "lp.pricing.features.memory").replace(
                      "{amount}",
                      formatMemory(config.memoryMb)
                    )}
                  />
                  <FeatureItem
                    text={t(locale, "lp.pricing.features.storage").replace(
                      "{amount}",
                      String(config.storageGb)
                    )}
                  />
                  <FeatureItem
                    text={t(locale, "lp.pricing.features.services").replace(
                      "{count}",
                      String(config.maxServices)
                    )}
                  />
                  {config.customDomain && (
                    <FeatureItem text={t(locale, "lp.pricing.features.customDomain")} />
                  )}
                  {config.alwaysOn && (
                    <FeatureItem text={t(locale, "lp.pricing.features.alwaysOn")} />
                  )}
                  {config.prioritySupport && (
                    <FeatureItem text={t(locale, "lp.pricing.features.priority")} />
                  )}
                  <FeatureItem text={t(locale, "lp.pricing.features.byok")} />
                </ul>

                {/* CTA */}
                <Link
                  href="/signup"
                  className={`block text-center h-10 leading-10 font-body font-medium text-sm rounded-none transition-colors ${
                    isPopular
                      ? "bg-gold text-dark hover:bg-gold-dark"
                      : isFree
                        ? "border border-light-border text-light-text hover:bg-light-surface"
                        : "bg-light-text text-light hover:opacity-90"
                  }`}
                >
                  {isFree
                    ? t(locale, "lp.pricing.cta.free")
                    : t(locale, "lp.pricing.cta.paid")}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="flex-shrink-0 mt-1 w-1 h-1 rounded-full bg-gold-dark" />
      <span className="font-body font-light text-[0.82rem] text-light-text-muted leading-snug">
        {text}
      </span>
    </li>
  );
}
