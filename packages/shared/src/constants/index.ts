import type { AIModel, AIProvider, SubscriptionTier } from "../types";

// =============================================================================
// Subscription Tier Limits
// =============================================================================

export interface TierConfig {
  tier: SubscriptionTier;
  priceUsd: number;
  priceJpy: number;
  creditsIncludedCents: number;
  cpuCores: number;
  memoryMb: number;
  storageGb: number;
  maxServices: number;
  customDomain: boolean;
  alwaysOn: boolean;
  rateLimitPerMin: number;
  maxWsConnections: number;
  maxUploadMb: number;
  prioritySupport: boolean;
}

export const TIER_CONFIGS: Record<SubscriptionTier, TierConfig> = {
  free: {
    tier: "free",
    priceUsd: 0,
    priceJpy: 0,
    creditsIncludedCents: 0,
    cpuCores: 1,
    memoryMb: 256,
    storageGb: 100,
    maxServices: 1,
    customDomain: false,
    alwaysOn: false,
    rateLimitPerMin: 30,
    maxWsConnections: 1,
    maxUploadMb: 10,
    prioritySupport: false,
  },
  basic: {
    tier: "basic",
    priceUsd: 18,
    priceJpy: 2700,
    creditsIncludedCents: 1000,
    cpuCores: 4,
    memoryMb: 32768,
    storageGb: 100,
    maxServices: 5,
    customDomain: true,
    alwaysOn: true,
    rateLimitPerMin: 120,
    maxWsConnections: 3,
    maxUploadMb: 100,
    prioritySupport: false,
  },
  pro: {
    tier: "pro",
    priceUsd: 64,
    priceJpy: 9500,
    creditsIncludedCents: 4000,
    cpuCores: 16,
    memoryMb: 131072,
    storageGb: 100,
    maxServices: 10,
    customDomain: true,
    alwaysOn: true,
    rateLimitPerMin: 300,
    maxWsConnections: 5,
    maxUploadMb: 500,
    prioritySupport: true,
  },
  ultra: {
    tier: "ultra",
    priceUsd: 200,
    priceJpy: 30000,
    creditsIncludedCents: 10000,
    cpuCores: 64,
    memoryMb: 524288,
    storageGb: 100,
    maxServices: 50,
    customDomain: true,
    alwaysOn: true,
    rateLimitPerMin: 600,
    maxWsConnections: 10,
    maxUploadMb: 1000,
    prioritySupport: true,
  },
};

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
