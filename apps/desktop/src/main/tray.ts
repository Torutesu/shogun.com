// =============================================================================
// SHOGUN Desktop — System Tray Icon + Menu
// =============================================================================

import { Tray, Menu, nativeImage, app } from "electron";
import { captureService } from "./capture";
import { transcriptionService } from "./transcription";
import { syncService } from "./sync";
import { getMainWindow } from "./index";

// ---------------------------------------------------------------------------
// Tray State
// ---------------------------------------------------------------------------

let tray: Tray | null = null;

// ---------------------------------------------------------------------------
// Tray Icon (16x16 template image, simple "S" glyph)
// ---------------------------------------------------------------------------

function createTrayIcon(): Electron.NativeImage {
  // Create a minimal 16x16 PNG template icon.
  // This is a simple white circle on transparent background, works as template
  // image on macOS (automatically adapts to dark/light mode).
  // For production, replace with a proper .png asset.
  const size = 16;
  const canvas = Buffer.alloc(size * size * 4, 0);

  // Draw a simple filled circle
  const cx = 8;
  const cy = 8;
  const r = 6;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) {
        const offset = (y * size + x) * 4;
        canvas[offset] = 255;     // R
        canvas[offset + 1] = 255; // G
        canvas[offset + 2] = 255; // B
        canvas[offset + 3] = 255; // A
      }
    }
  }

  const icon = nativeImage.createFromBuffer(canvas, {
    width: size,
    height: size,
  });
  icon.setTemplateImage(true);
  return icon;
}

// ---------------------------------------------------------------------------
// Status Label
// ---------------------------------------------------------------------------

function getStatusLabel(): string {
  if (syncService.status === "syncing") return "Syncing...";
  if (captureService.paused) return "Paused";
  return "Capturing";
}

// ---------------------------------------------------------------------------
// Context Menu
// ---------------------------------------------------------------------------

function buildContextMenu(): Electron.Menu {
  const capturing = !captureService.paused;
  const recording = transcriptionService.recording;

  return Menu.buildFromTemplate([
    {
      label: `Status: ${getStatusLabel()}`,
      enabled: false,
    },
    { type: "separator" },
    {
      label: capturing ? "Pause Capture" : "Resume Capture",
      click: () => {
        if (capturing) {
          captureService.pause();
        } else {
          captureService.resume();
        }
        updateTrayMenu();
      },
    },
    {
      label: recording ? "Stop Meeting Recording" : "Start Meeting Recording",
      click: () => {
        if (recording) {
          void transcriptionService.stop();
        } else {
          void transcriptionService.start();
        }
        updateTrayMenu();
      },
    },
    { type: "separator" },
    {
      label: "Settings",
      click: () => {
        const win = getMainWindow();
        if (win) {
          win.show();
          win.focus();
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit SHOGUN",
      click: () => {
        app.quit();
      },
    },
  ]);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function createTray(): void {
  if (tray) return;

  const icon = createTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip("SHOGUN \u2014 Active");
  tray.setContextMenu(buildContextMenu());

  // Click to toggle status window
  tray.on("click", () => {
    const win = getMainWindow();
    if (!win) return;

    if (win.isVisible()) {
      win.hide();
    } else {
      // Position window near tray icon
      const trayBounds = tray?.getBounds();
      if (trayBounds) {
        const winBounds = win.getBounds();
        const x = Math.round(
          trayBounds.x + trayBounds.width / 2 - winBounds.width / 2,
        );
        const y = process.platform === "darwin"
          ? trayBounds.y + trayBounds.height + 4
          : trayBounds.y - winBounds.height - 4;
        win.setPosition(x, y, false);
      }
      win.show();
      win.focus();
    }
  });
}

export function updateTrayMenu(): void {
  if (!tray) return;
  tray.setContextMenu(buildContextMenu());

  // Update tooltip based on state
  const status = getStatusLabel();
  tray.setToolTip(`SHOGUN \u2014 ${status}`);
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
