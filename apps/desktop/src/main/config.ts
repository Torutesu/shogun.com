// =============================================================================
// SHOGUN Desktop — Configuration Management
// =============================================================================

import { app } from "electron";
import * as fs from "node:fs";
import * as path from "node:path";

export interface DesktopConfig {
  apiUrl: string;
  authToken: string;
  captureEnabled: boolean;
  captureIntervalSec: number;
  excludedApps: string[];
  retentionDays: number | null;
  autoStart: boolean;
}

const DEFAULT_CONFIG: DesktopConfig = {
  apiUrl: "https://api.syogun.com",
  authToken: "",
  captureEnabled: true,
  captureIntervalSec: 30,
  excludedApps: [],
  retentionDays: null,
  autoStart: true,
};

let config: DesktopConfig = { ...DEFAULT_CONFIG };
let configPath = "";

function getConfigPath(): string {
  if (!configPath) {
    configPath = path.join(app.getPath("userData"), "config.json");
  }
  return configPath;
}

function validateConfig(parsed: unknown): Partial<DesktopConfig> {
  if (typeof parsed !== "object" || parsed === null) return {};
  const obj = parsed as Record<string, unknown>;
  const result: Partial<DesktopConfig> = {};
  if (typeof obj.apiUrl === "string") result.apiUrl = obj.apiUrl;
  if (typeof obj.authToken === "string") result.authToken = obj.authToken;
  if (typeof obj.captureEnabled === "boolean") result.captureEnabled = obj.captureEnabled;
  if (typeof obj.captureIntervalSec === "number") result.captureIntervalSec = obj.captureIntervalSec;
  if (Array.isArray(obj.excludedApps) && obj.excludedApps.every((v) => typeof v === "string")) {
    result.excludedApps = obj.excludedApps;
  }
  if (typeof obj.retentionDays === "number" || obj.retentionDays === null) {
    result.retentionDays = obj.retentionDays as number | null;
  }
  if (typeof obj.autoStart === "boolean") result.autoStart = obj.autoStart;
  return result;
}

export function loadConfig(): DesktopConfig {
  try {
    const filePath = getConfigPath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed: unknown = JSON.parse(raw);
      const validated = validateConfig(parsed);
      config = { ...DEFAULT_CONFIG, ...validated };
    } else {
      config = { ...DEFAULT_CONFIG };
      saveConfig();
    }
  } catch {
    config = { ...DEFAULT_CONFIG };
  }
  return config;
}

function saveConfig(): void {
  try {
    const filePath = getConfigPath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.error("[config] Failed to save config:", err);
  }
}

export function getConfig(): DesktopConfig {
  return { ...config };
}

export function get<K extends keyof DesktopConfig>(key: K): DesktopConfig[K] {
  return config[key];
}

export function set<K extends keyof DesktopConfig>(
  key: K,
  value: DesktopConfig[K],
): void {
  config[key] = value;
  saveConfig();
}

export function getAll(): DesktopConfig {
  return { ...config };
}
