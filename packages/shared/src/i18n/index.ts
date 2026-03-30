import type { Locale } from "../types";
import en from "./locales/en";
import ja from "./locales/ja";
import es from "./locales/es";

export type TranslationKey = keyof typeof en;

const translations: Record<Locale, Record<TranslationKey, string>> = {
  en,
  ja,
  es,
};

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale]?.[key] ?? translations.en[key] ?? key;
}

export function detectLocale(
  urlParam?: string | null,
  navigatorLang?: string | null,
  storedLang?: string | null,
): Locale {
  // Priority: URL param → stored → navigator → default
  const candidates = [urlParam, storedLang, navigatorLang?.slice(0, 2)];
  for (const candidate of candidates) {
    if (candidate === "ja" || candidate === "es" || candidate === "en") {
      return candidate;
    }
  }
  return "en";
}

export { en, ja, es };
