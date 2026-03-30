// =============================================================================
// SHOGUN Desktop — Auto-Update via electron-updater
// =============================================================================

import { EventEmitter } from "node:events";

export interface UpdateStatus {
  state: "idle" | "checking" | "available" | "downloading" | "downloaded" | "error";
  version?: string;
  error?: string;
  progress?: number;
}

const emitter = new EventEmitter();
let currentStatus: UpdateStatus = { state: "idle" };

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours
let intervalId: ReturnType<typeof setInterval> | null = null;

function setStatus(status: UpdateStatus): void {
  currentStatus = status;
  emitter.emit("status", status);
}

export function getUpdateStatus(): UpdateStatus {
  return currentStatus;
}

export function onUpdateStatus(handler: (status: UpdateStatus) => void): void {
  emitter.on("status", handler);
}

/**
 * Initialize the auto-updater. Call once after app is ready.
 * Uses dynamic import so the app still works if electron-updater is not installed.
 */
export async function initUpdater(): Promise<void> {
  try {
    const { autoUpdater } = await import("electron-updater");

    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on("checking-for-update", () => {
      setStatus({ state: "checking" });
    });

    autoUpdater.on("update-available", (info) => {
      setStatus({ state: "available", version: info.version });
    });

    autoUpdater.on("update-not-available", () => {
      setStatus({ state: "idle" });
    });

    autoUpdater.on("download-progress", (progress) => {
      setStatus({ state: "downloading", progress: progress.percent });
    });

    autoUpdater.on("update-downloaded", (info) => {
      setStatus({ state: "downloaded", version: info.version });
      // Prompt user: the update will be installed on next restart
      try {
        const { dialog } = require("electron");
        dialog
          .showMessageBox({
            type: "info",
            title: "SHOGUN Update",
            message: `Version ${info.version} has been downloaded. Restart to apply the update.`,
            buttons: ["Restart", "Later"],
          })
          .then((result: { response: number }) => {
            if (result.response === 0) {
              autoUpdater.quitAndInstall();
            }
          });
      } catch {
        // Silently continue if dialog fails
      }
    });

    autoUpdater.on("error", (err) => {
      setStatus({ state: "error", error: err?.message ?? "Unknown error" });
    });

    // Check on startup
    await autoUpdater.checkForUpdates();

    // Check periodically
    intervalId = setInterval(() => {
      autoUpdater.checkForUpdates().catch(() => {
        // Silently ignore periodic check failures
      });
    }, CHECK_INTERVAL_MS);
  } catch (err) {
    // electron-updater not available (dev mode or not installed)
    console.warn("[updater] electron-updater not available:", (err as Error).message);
  }
}

export function stopUpdater(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
