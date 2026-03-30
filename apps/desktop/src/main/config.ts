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

export function loadConfig(): DesktopConfig {
  try {
    const filePath = getConfigPath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw) as Partial<DesktopConfig>;
      config = { ...DEFAULT_CONFIG, ...parsed };
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
