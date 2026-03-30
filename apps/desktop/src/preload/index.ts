// =============================================================================
// SHOGUN Desktop — Preload Script (IPC Bridge)
// =============================================================================

import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

// ---------------------------------------------------------------------------
// Types (mirrored for renderer consumption)
// ---------------------------------------------------------------------------

export interface ShogunStatus {
  capturing: boolean;
  recording: boolean;
  syncStatus: "idle" | "syncing" | "error" | "offline";
  stats: {
    total: number;
    unsynced: number;
    today: number;
  };
}

export interface ShogunConfig {
  apiUrl: string;
  authToken: string;
  captureEnabled: boolean;
  captureIntervalSec: number;
  excludedApps: string[];
  retentionDays: number | null;
  autoStart: boolean;
}

export interface StatusUpdateEvent {
  type: "capture" | "captureState" | "transcriptionState" | "syncStatus" | "synced";
  data: unknown;
}

// ---------------------------------------------------------------------------
// Exposed API
// ---------------------------------------------------------------------------

const api = {
  getStatus: (): Promise<ShogunStatus> => {
    return ipcRenderer.invoke("shogun:getStatus");
  },

  pauseCapture: (): Promise<boolean> => {
    return ipcRenderer.invoke("shogun:pauseCapture");
  },

  resumeCapture: (): Promise<boolean> => {
    return ipcRenderer.invoke("shogun:resumeCapture");
  },

  startRecording: (): Promise<boolean> => {
    return ipcRenderer.invoke("shogun:startRecording");
  },

  stopRecording: (): Promise<boolean> => {
    return ipcRenderer.invoke("shogun:stopRecording");
  },

  getConfig: (): Promise<ShogunConfig> => {
    return ipcRenderer.invoke("shogun:getConfig");
  },

  setConfig: (key: string, value: unknown): Promise<boolean> => {
    return ipcRenderer.invoke("shogun:setConfig", key, value);
  },

  onStatusUpdate: (callback: (event: StatusUpdateEvent) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, data: StatusUpdateEvent): void => {
      callback(data);
    };
    ipcRenderer.on("shogun:statusUpdate", handler);

    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener("shogun:statusUpdate", handler);
    };
  },
};

// Expose to renderer via contextBridge
contextBridge.exposeInMainWorld("shogun", api);

// Type declaration for renderer
declare global {
  interface Window {
    shogun: typeof api;
  }
}
