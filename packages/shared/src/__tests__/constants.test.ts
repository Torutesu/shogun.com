import { describe, it, expect } from "vitest";
import {
  PLAN,
  ANNUAL_TOTAL_USD,
  MONTHLY_TOTAL_USD,
  ANNUAL_SAVINGS_USD,
  MODEL_CONFIGS,
  HANDLE_REGEX,
  RESERVED_HANDLES,
  FLY_REGIONS,
  LOCALE_REGION_MAP,
} from "../constants";

describe("PLAN", () => {
  it("has correct annual price ($49/mo)", () => {
    expect(PLAN.priceAnnualUsd).toBe(49);
  });

  it("has correct monthly price ($62/mo, 25% markup)", () => {
    expect(PLAN.priceMonthlyUsd).toBe(62);
  });

  it("monthly is ~25% more than annual", () => {
    const markup = (PLAN.priceMonthlyUsd - PLAN.priceAnnualUsd) / PLAN.priceAnnualUsd;
    expect(markup).toBeCloseTo(0.265, 1);
  });

  it("annual total is $588/yr", () => {
    expect(ANNUAL_TOTAL_USD).toBe(588);
  });

  it("monthly total is $744/yr", () => {
    expect(MONTHLY_TOTAL_USD).toBe(744);
  });

  it("annual savings is $156/yr", () => {
    expect(ANNUAL_SAVINGS_USD).toBe(156);
  });

  it("includes $5 demo credits (500 cents)", () => {
    expect(PLAN.demoCreditsCents).toBe(500);
  });

  it("has required resource properties", () => {
    expect(PLAN.cpuCores).toBe(8);
    expect(PLAN.memoryMb).toBe(65536);
    expect(PLAN.storageGb).toBe(100);
    expect(PLAN.maxServices).toBe(10);
    expect(PLAN.customDomain).toBe(true);
    expect(PLAN.alwaysOn).toBe(true);
    expect(PLAN.maxUploadMb).toBe(500);
  });
});

describe("MODEL_CONFIGS", () => {
  const expectedModels = [
    "claude-sonnet-4-20250514",
    "claude-opus-4-20250514",
    "gpt-4o",
    "gpt-4o-mini",
    "gemini-2.0-flash",
    "gemini-2.5-pro",
  ] as const;

  it("has all expected models", () => {
    expect(Object.keys(MODEL_CONFIGS).sort()).toEqual([...expectedModels].sort());
  });

  it.each(expectedModels)("model '%s' has required properties", (model) => {
    const config = MODEL_CONFIGS[model];
    expect(config.id).toBe(model);
    expect(["anthropic", "openai", "google"]).toContain(config.provider);
    expect(config.name).toBeTruthy();
    expect(typeof config.inputPricePer1k).toBe("number");
    expect(typeof config.outputPricePer1k).toBe("number");
    expect(typeof config.maxTokens).toBe("number");
    expect(config.maxTokens).toBeGreaterThan(0);
    expect(typeof config.supportsTools).toBe("boolean");
    expect(typeof config.supportsVision).toBe("boolean");
  });

  it("claude models use anthropic provider", () => {
    expect(MODEL_CONFIGS["claude-sonnet-4-20250514"].provider).toBe("anthropic");
    expect(MODEL_CONFIGS["claude-opus-4-20250514"].provider).toBe("anthropic");
  });

  it("gpt models use openai provider", () => {
    expect(MODEL_CONFIGS["gpt-4o"].provider).toBe("openai");
    expect(MODEL_CONFIGS["gpt-4o-mini"].provider).toBe("openai");
  });

  it("gemini models use google provider", () => {
    expect(MODEL_CONFIGS["gemini-2.0-flash"].provider).toBe("google");
    expect(MODEL_CONFIGS["gemini-2.5-pro"].provider).toBe("google");
  });
});

describe("HANDLE_REGEX", () => {
  it("matches valid handles", () => {
    expect(HANDLE_REGEX.test("john")).toBe(true);
    expect(HANDLE_REGEX.test("john-doe")).toBe(true);
    expect(HANDLE_REGEX.test("user123")).toBe(true);
    expect(HANDLE_REGEX.test("a1b")).toBe(true);
    expect(HANDLE_REGEX.test("abc")).toBe(true);
  });

  it("rejects handles with uppercase", () => {
    expect(HANDLE_REGEX.test("JohnDoe")).toBe(false);
    expect(HANDLE_REGEX.test("ADMIN")).toBe(false);
  });

  it("rejects handles starting or ending with hyphen", () => {
    expect(HANDLE_REGEX.test("-user")).toBe(false);
    expect(HANDLE_REGEX.test("user-")).toBe(false);
  });

  it("rejects handles with underscores or dots", () => {
    expect(HANDLE_REGEX.test("user_name")).toBe(false);
    expect(HANDLE_REGEX.test("user.name")).toBe(false);
  });

  it("rejects handles with spaces", () => {
    expect(HANDLE_REGEX.test("user name")).toBe(false);
  });

  it("rejects handles that are too short", () => {
    expect(HANDLE_REGEX.test("ab")).toBe(false);
    expect(HANDLE_REGEX.test("a")).toBe(false);
  });
});

describe("RESERVED_HANDLES", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(RESERVED_HANDLES)).toBe(true);
    expect(RESERVED_HANDLES.length).toBeGreaterThan(0);
  });

  it("contains critical reserved words", () => {
    expect(RESERVED_HANDLES).toContain("admin");
    expect(RESERVED_HANDLES).toContain("api");
    expect(RESERVED_HANDLES).toContain("www");
    expect(RESERVED_HANDLES).toContain("shogun");
    expect(RESERVED_HANDLES).toContain("login");
    expect(RESERVED_HANDLES).toContain("signup");
    expect(RESERVED_HANDLES).toContain("settings");
    expect(RESERVED_HANDLES).toContain("billing");
    expect(RESERVED_HANDLES).toContain("support");
  });

  it("all entries are lowercase strings", () => {
    for (const handle of RESERVED_HANDLES) {
      expect(handle).toBe(handle.toLowerCase());
    }
  });
});

describe("FLY_REGIONS", () => {
  it("has expected regions", () => {
    expect(FLY_REGIONS).toHaveProperty("nrt");
    expect(FLY_REGIONS).toHaveProperty("iad");
    expect(FLY_REGIONS).toHaveProperty("lax");
    expect(FLY_REGIONS).toHaveProperty("ams");
  });

  it("each region has name and location", () => {
    for (const [code, region] of Object.entries(FLY_REGIONS)) {
      expect(region.name, `region ${code} should have a name`).toBeTruthy();
      expect(region.location, `region ${code} should have a location`).toBeTruthy();
    }
  });

  it("nrt is Tokyo, Japan", () => {
    expect(FLY_REGIONS["nrt"]!.name).toBe("Tokyo");
    expect(FLY_REGIONS["nrt"]!.location).toBe("Japan");
  });
});

describe("LOCALE_REGION_MAP", () => {
  it("maps ja to nrt (Tokyo)", () => {
    expect(LOCALE_REGION_MAP.ja).toBe("nrt");
  });

  it("maps en to iad (US East)", () => {
    expect(LOCALE_REGION_MAP.en).toBe("iad");
  });

  it("maps es to gru (São Paulo)", () => {
    expect(LOCALE_REGION_MAP.es).toBe("gru");
  });

  it("has mappings for all supported locales", () => {
    expect(Object.keys(LOCALE_REGION_MAP).sort()).toEqual(["en", "es", "ja"]);
  });
});
