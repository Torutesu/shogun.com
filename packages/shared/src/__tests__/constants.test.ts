import { describe, it, expect } from "vitest";
import {
  TIER_CONFIGS,
  MODEL_CONFIGS,
  HANDLE_REGEX,
  RESERVED_HANDLES,
  FLY_REGIONS,
  LOCALE_REGION_MAP,
} from "../constants";

describe("TIER_CONFIGS", () => {
  const tiers = ["free", "basic", "pro", "ultra"] as const;

  it("has all 4 tiers", () => {
    expect(Object.keys(TIER_CONFIGS).sort()).toEqual([...tiers].sort());
  });

  it.each(tiers)("tier '%s' has all required properties", (tier) => {
    const config = TIER_CONFIGS[tier];
    expect(config.tier).toBe(tier);
    expect(typeof config.priceUsd).toBe("number");
    expect(typeof config.priceJpy).toBe("number");
    expect(typeof config.creditsIncludedCents).toBe("number");
    expect(typeof config.cpuCores).toBe("number");
    expect(typeof config.memoryMb).toBe("number");
    expect(typeof config.storageGb).toBe("number");
    expect(typeof config.maxServices).toBe("number");
    expect(typeof config.customDomain).toBe("boolean");
    expect(typeof config.alwaysOn).toBe("boolean");
    expect(typeof config.rateLimitPerMin).toBe("number");
    expect(typeof config.maxWsConnections).toBe("number");
    expect(typeof config.maxUploadMb).toBe("number");
    expect(typeof config.prioritySupport).toBe("boolean");
  });

  it("free tier has $0 price and no credits", () => {
    expect(TIER_CONFIGS.free.priceUsd).toBe(0);
    expect(TIER_CONFIGS.free.creditsIncludedCents).toBe(0);
  });

  it("paid tiers have increasing prices", () => {
    expect(TIER_CONFIGS.basic.priceUsd).toBeLessThan(TIER_CONFIGS.pro.priceUsd);
    expect(TIER_CONFIGS.pro.priceUsd).toBeLessThan(TIER_CONFIGS.ultra.priceUsd);
  });

  it("paid tiers have increasing credits", () => {
    expect(TIER_CONFIGS.basic.creditsIncludedCents).toBeLessThan(TIER_CONFIGS.pro.creditsIncludedCents);
    expect(TIER_CONFIGS.pro.creditsIncludedCents).toBeLessThan(TIER_CONFIGS.ultra.creditsIncludedCents);
  });

  it("paid tiers have increasing rate limits", () => {
    expect(TIER_CONFIGS.free.rateLimitPerMin).toBeLessThan(TIER_CONFIGS.basic.rateLimitPerMin);
    expect(TIER_CONFIGS.basic.rateLimitPerMin).toBeLessThan(TIER_CONFIGS.pro.rateLimitPerMin);
    expect(TIER_CONFIGS.pro.rateLimitPerMin).toBeLessThan(TIER_CONFIGS.ultra.rateLimitPerMin);
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
