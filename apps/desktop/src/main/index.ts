// =============================================================================
// SHOGUN Desktop — Electron Main Process Entry
// =============================================================================

import {
  app,
  BrowserWindow,
  ipcMain,
  type IpcMainInvokeEvent,
} from "electron";
import * as path from "node:path";
import { loadConfig, getConfig, get, set, type DesktopConfig } from "./config";
import { initStore, getStats, closeStore } from "./store";
import { captureService } from "./capture";
import { transcriptionService } from "./transcription";
import { syncService } from "./sync";
import { createTray, destroyTray, updateTrayMenu } from "./tray";
import { initUpdater, stopUpdater } from "./updater";

// ---------------------------------------------------------------------------
// Single Instance Lock
// ---------------------------------------------------------------------------

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

// ---------------------------------------------------------------------------
// Global State
// ---------------------------------------------------------------------------

let mainWindow: BrowserWindow | null = null;

function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export { getMainWindow };

// ---------------------------------------------------------------------------
// Window Creation
// ---------------------------------------------------------------------------

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 600,
    show: false,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    titleBarStyle: "hidden",
    backgroundColor: "#080808",
    webPreferences: {
      preload: path.join(__dirname, "..", "preload", "index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Load renderer
  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(
      path.join(__dirname, "..", "renderer", "index.html"),
    );
  }

  mainWindow.on("close", (e) => {
    // Prevent closing; hide to tray instead
    if (mainWindow && !isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.on("blur", () => {
    // Hide when losing focus (tray-style behavior)
    if (mainWindow && !mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.hide();
    }
  });
}

// ---------------------------------------------------------------------------
// IPC Handlers
// ---------------------------------------------------------------------------

function setupIPC(): void {
  ipcMain.handle("shogun:getStatus", () => {
    return {
      capturing: !captureService.paused && get("captureEnabled"),
      recording: transcriptionService.recording,
      syncStatus: syncService.status,
      stats: getStats(),
    };
  });

  ipcMain.handle("shogun:pauseCapture", () => {
    captureService.pause();
    updateTrayMenu();
    return true;
  });

  ipcMain.handle("shogun:resumeCapture", () => {
    captureService.resume();
    updateTrayMenu();
    return true;
  });

  ipcMain.handle("shogun:startRecording", async () => {
    await transcriptionService.start();
    updateTrayMenu();
    return true;
  });

  ipcMain.handle("shogun:stopRecording", async () => {
    await transcriptionService.stop();
    updateTrayMenu();
    return true;
  });

  ipcMain.handle("shogun:getConfig", () => {
    return getConfig();
  });

  ipcMain.handle(
    "shogun:setConfig",
    (
      _event: IpcMainInvokeEvent,
      key: keyof DesktopConfig,
      value: DesktopConfig[keyof DesktopConfig],
    ) => {
      // Type-safe set with runtime key validation
      const validKeys: Array<keyof DesktopConfig> = [
        "apiUrl",
        "authToken",
        "captureEnabled",
        "captureIntervalSec",
        "excludedApps",
        "retentionDays",
        "autoStart",
      ];
      if (!validKeys.includes(key)) {
        throw new Error(`Invalid config key: ${String(key)}`);
      }
      (set as (k: string, v: unknown) => void)(key, value);

      // Handle auto-start changes
      if (key === "autoStart") {
        app.setLoginItemSettings({ openAtLogin: Boolean(value) });
      }

      updateTrayMenu();
      return true;
    },
  );
}

// ---------------------------------------------------------------------------
// Event Forwarding (main → renderer)
// ---------------------------------------------------------------------------

function setupEventForwarding(): void {
  const sendToRenderer = (channel: string, data: unknown): void => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, data);
    }
  };

  captureService.on("capture", (event) => {
    sendToRenderer("shogun:statusUpdate", {
      type: "capture",
      data: event,
    });
  });

  captureService.on("stateChange", (state) => {
    sendToRenderer("shogun:statusUpdate", {
      type: "captureState",
      data: state,
    });
    updateTrayMenu();
  });

  transcriptionService.on("stateChange", (state) => {
    sendToRenderer("shogun:statusUpdate", {
      type: "transcriptionState",
      data: state,
    });
    updateTrayMenu();
  });

  syncService.on("statusChange", (status) => {
    sendToRenderer("shogun:statusUpdate", {
      type: "syncStatus",
      data: status,
    });
  });

  syncService.on("synced", (data) => {
    sendToRenderer("shogun:statusUpdate", {
      type: "synced",
      data,
    });
  });
}

// ---------------------------------------------------------------------------
// App Lifecycle
// ---------------------------------------------------------------------------

// Track quit state
let isQuitting = false;

app.on("ready", async () => {
  try {
    // 1. Load configuration
    loadConfig();

    // 2. Initialize local store (SQLite)
    initStore();

    // 3. Create the hidden status window
    createWindow();

    // 4. Set up system tray
    createTray();

    // 5. Set up IPC handlers
    setupIPC();

    // 6. Forward events to renderer
    setupEventForwarding();

    // 7. Initialize OCR worker
    await captureService.init();

    // 8. Start capture if enabled
    if (get("captureEnabled")) {
      captureService.start();
    }

    // 9. Start sync service
    syncService.start();

    // 10. Configure auto-start
    if (get("autoStart") && !process.env.ELECTRON_IS_DEV) {
      app.setLoginItemSettings({ openAtLogin: true });
    }

    // 11. Initialize auto-updater
    await initUpdater();

    console.log("[main] SHOGUN Desktop initialized");
  } catch (err) {
    console.error("[main] Initialization error:", err);
  }
});

app.on("window-all-closed", () => {
  // On macOS, apps typically stay active until explicit quit
  if (process.platform !== "darwin") {
    // Don't quit; we run in the tray
  }
});

app.on("activate", () => {
  // On macOS, re-create window if dock icon clicked and no windows exist
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

app.on("second-instance", () => {
  // If a second instance is launched, show/focus the existing window
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on("before-quit", async () => {
  isQuitting = true;

  try {
    await captureService.destroy();
    syncService.stop();
    stopUpdater();
    closeStore();
    destroyTray();
  } catch (err) {
    console.error("[main] Cleanup error:", err);
  }
});
