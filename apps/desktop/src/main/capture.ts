// =============================================================================
// SHOGUN Desktop — Screen Capture + OCR Pipeline
// =============================================================================

import { desktopCapturer, BrowserWindow } from "electron";
import { createWorker, Worker } from "tesseract.js";
import { EventEmitter } from "node:events";
import { get as getConfigValue } from "./config";
import { insert } from "./store";
import type { MemorySource } from "@shogun/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CaptureEvent {
  id: number;
  content: string;
  appName: string;
  windowTitle: string;
  capturedAt: string;
}

// ---------------------------------------------------------------------------
// Text comparison — Jaccard similarity of word sets
// ---------------------------------------------------------------------------

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\u3000-\u9fff\uf900-\ufaff]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordSet(text: string): Set<string> {
  const normalized = normalizeText(text);
  if (normalized.length === 0) return new Set();
  return new Set(normalized.split(" ").filter((w) => w.length > 1));
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = wordSet(a);
  const setB = wordSet(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ---------------------------------------------------------------------------
// Active window detection (platform-specific)
// ---------------------------------------------------------------------------

interface ActiveWindowInfo {
  appName: string;
  title: string;
}

async function getActiveWindow(): Promise<ActiveWindowInfo> {
  // Use Electron's built-in focus detection as a reasonable default.
  // Focused BrowserWindow gives us limited info, but we can augment with
  // platform-specific approaches as needed.
  try {
    const focused = BrowserWindow.getFocusedWindow();
    if (focused) {
      return {
        appName: "SHOGUN",
        title: focused.getTitle(),
      };
    }

    // For non-Electron windows we attempt platform-specific detection.
    // This uses child_process to query the OS.
    const { execFileSync } = await import("node:child_process");
    const platform = process.platform;

    if (platform === "darwin") {
      const script = `
        tell application "System Events"
          set frontApp to first application process whose frontmost is true
          set appName to name of frontApp
          set winTitle to ""
          try
            set winTitle to name of front window of frontApp
          end try
          return appName & "|" & winTitle
        end tell
      `;
      const result = execFileSync("osascript", ["-e", script], {
        encoding: "utf-8",
        timeout: 3000,
      }).trim();
      const [appName = "Unknown", title = ""] = result.split("|");
      return { appName, title };
    }

    if (platform === "win32") {
      // PowerShell: get foreground window title and process name
      const ps = `
        Add-Type @"
          using System;
          using System.Runtime.InteropServices;
          public class Win {
            [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
            [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
          }
"@
        $hwnd = [Win]::GetForegroundWindow()
        $pid = 0
        [Win]::GetWindowThreadProcessId($hwnd, [ref]$pid) | Out-Null
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        "$($proc.ProcessName)|$($proc.MainWindowTitle)"
      `;
      const result = execFileSync("powershell", ["-NoProfile", "-Command", ps], {
        encoding: "utf-8",
        timeout: 3000,
      }).trim();
      const [appName = "Unknown", title = ""] = result.split("|");
      return { appName, title };
    }

    if (platform === "linux") {
      // xdotool approach
      try {
        const windowId = execFileSync("xdotool", ["getactivewindow"], {
          encoding: "utf-8",
          timeout: 2000,
        }).trim();
        const title = execFileSync("xdotool", ["getactivewindow", "getwindowname"], {
          encoding: "utf-8",
          timeout: 2000,
        }).trim();
        const pid = execFileSync(
          "xdotool", ["getactivewindow", "getwindowpid"],
          { encoding: "utf-8", timeout: 2000 },
        ).trim();
        const appName = execFileSync(
          "ps", ["-p", pid, "-o", "comm="],
          { encoding: "utf-8", timeout: 2000 },
        ).trim() || "Unknown";
        return { appName, title };
      } catch {
        return { appName: "Unknown", title: "" };
      }
    }

    return { appName: "Unknown", title: "" };
  } catch {
    return { appName: "Unknown", title: "" };
  }
}

// ---------------------------------------------------------------------------
// Capture Service
// ---------------------------------------------------------------------------

class CaptureService extends EventEmitter {
  private timer: ReturnType<typeof setInterval> | null = null;
  private ocrWorker: Worker | null = null;
  private previousText = "";
  private _paused = false;
  private initializing = false;

  get paused(): boolean {
    return this._paused;
  }

  async init(): Promise<void> {
    if (this.initializing) return;
    this.initializing = true;
    try {
      this.ocrWorker = await createWorker("eng");
      console.log("[capture] OCR worker initialized");
    } catch (err) {
      console.error("[capture] Failed to init OCR worker:", err);
    } finally {
      this.initializing = false;
    }
  }

  start(): void {
    if (this.timer) return;
    this._paused = false;

    const intervalMs = (getConfigValue("captureIntervalSec") ?? 30) * 1000;
    this.timer = setInterval(() => {
      void this.tick();
    }, intervalMs);

    // Run once immediately
    void this.tick();
    console.log(`[capture] Started (every ${intervalMs / 1000}s)`);
    this.emit("stateChange", { capturing: true });
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log("[capture] Stopped");
    this.emit("stateChange", { capturing: false });
  }

  pause(): void {
    this._paused = true;
    this.emit("stateChange", { capturing: false });
    console.log("[capture] Paused");
  }

  resume(): void {
    this._paused = false;
    this.emit("stateChange", { capturing: true });
    console.log("[capture] Resumed");
  }

  async destroy(): Promise<void> {
    this.stop();
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
      this.ocrWorker = null;
    }
  }

  private async tick(): Promise<void> {
    if (this._paused) return;
    if (!getConfigValue("captureEnabled")) return;

    try {
      // 1. Get active window info
      const windowInfo = await getActiveWindow();

      // 2. Check excluded apps
      const excluded = getConfigValue("excludedApps") ?? [];
      const appLower = windowInfo.appName.toLowerCase();
      if (excluded.some((ex) => appLower.includes(ex.toLowerCase()))) {
        return;
      }

      // 3. Capture screen
      const sources = await desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: { width: 1920, height: 1080 },
      });

      if (sources.length === 0) return;

      const source = sources[0]!;
      const image = source.thumbnail;
      if (image.isEmpty()) return;

      // 4. Convert to PNG buffer for OCR
      const pngBuffer = image.toPNG();

      // 5. Run OCR
      if (!this.ocrWorker) {
        console.warn("[capture] OCR worker not ready, skipping");
        return;
      }

      const {
        data: { text },
      } = await this.ocrWorker.recognize(pngBuffer);

      // 6. Check meaningful content (>20 chars)
      const trimmed = text.trim();
      if (trimmed.length <= 20) return;

      // 7. Compare with previous capture
      const similarity = jaccardSimilarity(trimmed, this.previousText);
      if (similarity > 0.7) {
        // Less than 30% different, skip
        return;
      }

      this.previousText = trimmed;

      // 8. Store to local SQLite
      const source_type: MemorySource = "screen_capture";
      const id = insert({
        source: source_type,
        content: trimmed,
        appName: windowInfo.appName,
        windowTitle: windowInfo.title,
      });

      const event: CaptureEvent = {
        id,
        content: trimmed,
        appName: windowInfo.appName,
        windowTitle: windowInfo.title,
        capturedAt: new Date().toISOString(),
      };

      this.emit("capture", event);
    } catch (err) {
      console.error("[capture] Tick error:", err);
    }
  }
}

export const captureService = new CaptureService();
