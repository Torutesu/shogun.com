import type { AIModel, AIProvider, BillingInterval } from "../types";

// =============================================================================
// Subscription Plan
// =============================================================================

export interface PlanConfig {
  name: string;
  priceMonthlyUsd: number;   // monthly billing: $62/mo
  priceAnnualUsd: number;    // annual billing: $49/mo ($588/yr)
  demoCreditsCents: number;  // one-time demo credits for new users
  cpuCores: number;
  memoryMb: number;
  storageGb: number;
  maxServices: number;
  customDomain: boolean;
  alwaysOn: boolean;
  maxUploadMb: number;
}

export const PLAN: PlanConfig = {
  name: "SHOGUN",
  priceMonthlyUsd: 62,       // $62/mo (25% markup over annual)
  priceAnnualUsd: 49,        // $49/mo billed annually ($588/yr)
  demoCreditsCents: 500,     // $5 one-time demo credits
  cpuCores: 8,
  memoryMb: 65536,           // 64GB
  storageGb: 100,
  maxServices: 10,
  customDomain: true,
  alwaysOn: true,
  maxUploadMb: 500,
};

// Annual savings
export const ANNUAL_TOTAL_USD = PLAN.priceAnnualUsd * 12;    // $588
export const MONTHLY_TOTAL_USD = PLAN.priceMonthlyUsd * 12;  // $744
export const ANNUAL_SAVINGS_USD = MONTHLY_TOTAL_USD - ANNUAL_TOTAL_USD; // $156

// For backwards compatibility — maps the single tier
export const TIER_CONFIGS = {
  shogun: PLAN,
} as const;

// =============================================================================
// AI Model Metadata
// =============================================================================

export interface ModelConfig {
  id: AIModel;
  provider: AIProvider;
  name: string;
  inputPricePer1k: number;   // cents per 1K tokens
  outputPricePer1k: number;
  maxTokens: number;
  supportsTools: boolean;
  supportsVision: boolean;
}

export const MODEL_CONFIGS: Record<AIModel, ModelConfig> = {
  "claude-sonnet-4-20250514": {
    id: "claude-sonnet-4-20250514",
    provider: "anthropic",
    name: "Claude Sonnet 4",
    inputPricePer1k: 0.3,
    outputPricePer1k: 1.5,
    maxTokens: 200000,
    supportsTools: true,
    supportsVision: true,
  },
  "claude-opus-4-20250514": {
    id: "claude-opus-4-20250514",
    provider: "anthropic",
    name: "Claude Opus 4",
    inputPricePer1k: 1.5,
    outputPricePer1k: 7.5,
    maxTokens: 200000,
    supportsTools: true,
    supportsVision: true,
  },
  "gpt-4o": {
    id: "gpt-4o",
    provider: "openai",
    name: "GPT-4o",
    inputPricePer1k: 0.25,
    outputPricePer1k: 1.0,
    maxTokens: 128000,
    supportsTools: true,
    supportsVision: true,
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    provider: "openai",
    name: "GPT-4o Mini",
    inputPricePer1k: 0.015,
    outputPricePer1k: 0.06,
    maxTokens: 128000,
    supportsTools: true,
    supportsVision: true,
  },
  "gemini-2.0-flash": {
    id: "gemini-2.0-flash",
    provider: "google",
    name: "Gemini 2.0 Flash",
    inputPricePer1k: 0.01,
    outputPricePer1k: 0.04,
    maxTokens: 1000000,
    supportsTools: true,
    supportsVision: true,
  },
  "gemini-2.5-pro": {
    id: "gemini-2.5-pro",
    provider: "google",
    name: "Gemini 2.5 Pro",
    inputPricePer1k: 0.125,
    outputPricePer1k: 0.5,
    maxTokens: 1000000,
    supportsTools: true,
    supportsVision: true,
  },
};

// =============================================================================
// Fly.io Region Mapping
// =============================================================================

export const FLY_REGIONS: Record<string, { name: string; location: string }> = {
  nrt: { name: "Tokyo", location: "Japan" },
  iad: { name: "Ashburn", location: "US East" },
  lax: { name: "Los Angeles", location: "US West" },
  ams: { name: "Amsterdam", location: "Europe" },
  gru: { name: "São Paulo", location: "South America" },
};

// Locale → default region
export const LOCALE_REGION_MAP: Record<string, string> = {
  ja: "nrt",
  en: "iad",
  es: "gru",
};

// =============================================================================
// Handle Validation
// =============================================================================

export const HANDLE_MIN_LENGTH = 3;
export const HANDLE_MAX_LENGTH = 30;
export const HANDLE_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
export const RESERVED_HANDLES = [
  "admin",
  "api",
  "app",
  "billing",
  "blog",
  "dashboard",
  "docs",
  "help",
  "login",
  "logout",
  "mail",
  "root",
  "settings",
  "shogun",
  "signup",
  "status",
  "support",
  "www",
];
