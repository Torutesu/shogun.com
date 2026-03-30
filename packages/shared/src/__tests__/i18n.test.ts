import { describe, it, expect } from "vitest";
import { en, ja, es, detectLocale } from "../i18n";

describe("i18n locale completeness", () => {
  const enKeys = Object.keys(en).sort();
  const jaKeys = Object.keys(ja).sort();
  const esKeys = Object.keys(es).sort();

  it("ja has the same keys as en", () => {
    expect(jaKeys).toEqual(enKeys);
  });

  it("es has the same keys as en", () => {
    expect(esKeys).toEqual(enKeys);
  });

  it("no locale has empty values", () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value, `en key "${key}" should not be empty`).toBeTruthy();
    }
    for (const [key, value] of Object.entries(ja)) {
      expect(value, `ja key "${key}" should not be empty`).toBeTruthy();
    }
    for (const [key, value] of Object.entries(es)) {
      expect(value, `es key "${key}" should not be empty`).toBeTruthy();
    }
  });
});

describe("detectLocale", () => {
  it("returns URL param when valid", () => {
    expect(detectLocale("ja")).toBe("ja");
    expect(detectLocale("es")).toBe("es");
    expect(detectLocale("en")).toBe("en");
  });

  it("falls back to stored language", () => {
    expect(detectLocale(null, null, "ja")).toBe("ja");
  });

  it("falls back to navigator language", () => {
    expect(detectLocale(null, "ja-JP", null)).toBe("ja");
    expect(detectLocale(null, "es-MX", null)).toBe("es");
  });

  it("returns en as default when nothing matches", () => {
    expect(detectLocale(null, null, null)).toBe("en");
    expect(detectLocale(null, "zh-CN", null)).toBe("en");
    expect(detectLocale("fr")).toBe("en");
  });

  it("URL param takes priority over stored and navigator", () => {
    expect(detectLocale("es", "ja-JP", "en")).toBe("es");
  });

  it("stored takes priority over navigator", () => {
    expect(detectLocale(null, "ja-JP", "es")).toBe("es");
  });
});
