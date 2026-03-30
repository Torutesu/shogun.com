// =============================================================================
// SHOGUN Desktop — Batch Sync to API
// =============================================================================

import { EventEmitter } from "node:events";
import { get as getConfigValue } from "./config";
import { getUnsynced, markSynced, deleteOld, getStats, type CaptureRow } from "./store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SyncStatus = "idle" | "syncing" | "error" | "offline";

interface SyncResult {
  synced: number;
  failed: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SYNC_INTERVAL_MS = 60_000;       // Sync every 60 seconds
const BATCH_SIZE = 20;                  // Send 20 entries per request
const BUFFER_THRESHOLD = 50;            // Trigger sync when buffer reaches 50
const MAX_RETRY_DELAY_MS = 300_000;     // Max 5 minutes between retries
const BASE_RETRY_DELAY_MS = 5_000;      // Start with 5 second retry delay

// ---------------------------------------------------------------------------
// Sync Service
// ---------------------------------------------------------------------------

class SyncService extends EventEmitter {
  private timer: ReturnType<typeof setInterval> | null = null;
  private _status: SyncStatus = "idle";
  private retryCount = 0;
  private syncing = false;

  get status(): SyncStatus {
    return this._status;
  }

  start(): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      void this.tick();
    }, SYNC_INTERVAL_MS);

    // Initial sync after short delay
    setTimeout(() => {
      void this.tick();
    }, 5_000);

    console.log("[sync] Service started");
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log("[sync] Service stopped");
  }

  /** Called externally when a new capture is added to check buffer threshold */
  notifyNewCapture(): void {
    const stats = getStats();
    if (stats.unsynced >= BUFFER_THRESHOLD) {
      void this.tick();
    }
  }

  private setStatus(status: SyncStatus): void {
    if (this._status === status) return;
    this._status = status;
    this.emit("statusChange", status);
  }

  private async tick(): Promise<void> {
    // Prevent overlapping syncs
    if (this.syncing) return;

    const authToken = getConfigValue("authToken");
    if (!authToken) {
      // No auth token, can't sync — just queue locally
      this.setStatus("offline");
      return;
    }

    const unsynced = getUnsynced(BATCH_SIZE * 5); // Get up to 100 entries
    if (unsynced.length === 0) {
      this.setStatus("idle");
      return;
    }

    this.syncing = true;
    this.setStatus("syncing");

    try {
      const result = await this.syncEntries(unsynced);

      if (result.synced > 0) {
        this.retryCount = 0; // Reset retry on success
        this.emit("synced", {
          count: result.synced,
          stats: getStats(),
        });
      }

      if (result.failed > 0) {
        console.warn(`[sync] ${result.failed} entries failed to sync`);
      }

      // Clean up old synced entries if retention is configured
      const retentionDays = getConfigValue("retentionDays");
      if (retentionDays !== null && retentionDays > 0) {
        const deleted = deleteOld(retentionDays);
        if (deleted > 0) {
          console.log(`[sync] Cleaned up ${deleted} old entries`);
        }
      }

      this.setStatus(result.failed > 0 ? "error" : "idle");
    } catch (err) {
      console.error("[sync] Sync error:", err);
      this.handleSyncError();
    } finally {
      this.syncing = false;
    }
  }

  private async syncEntries(entries: CaptureRow[]): Promise<SyncResult> {
    const apiUrl = getConfigValue("apiUrl");
    const authToken = getConfigValue("authToken");

    if (!authToken) {
      return { synced: 0, failed: entries.length };
    }

    let totalSynced = 0;
    let totalFailed = 0;

    // Process in batches of BATCH_SIZE
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);

      try {
        const payload = batch.map((row) => ({
          source: row.source,
          content: row.content,
          appName: row.app_name,
          windowTitle: row.window_title,
          capturedAt: row.captured_at,
        }));

        const response = await fetch(`${apiUrl}/memory/capture`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ entries: payload }),
          signal: AbortSignal.timeout(30_000), // 30s timeout per batch
        });

        if (response.status === 401) {
          // Auth token expired/invalid
          console.warn("[sync] Auth token invalid (401), going offline");
          this.setStatus("offline");
          return { synced: totalSynced, failed: totalFailed + batch.length };
        }

        if (!response.ok) {
          console.error(`[sync] API error: ${response.status}`);
          totalFailed += batch.length;
          continue;
        }

        // Mark batch as synced
        const ids = batch.map((row) => row.id);
        markSynced(ids);
        totalSynced += batch.length;
      } catch (err) {
        if (err instanceof TypeError && (err.message.includes("fetch") || err.message.includes("network"))) {
          // Network error — offline
          this.setStatus("offline");
          return { synced: totalSynced, failed: totalFailed + (entries.length - i) };
        }
        console.error("[sync] Batch sync error:", err);
        totalFailed += batch.length;
      }
    }

    return { synced: totalSynced, failed: totalFailed };
  }

  private handleSyncError(): void {
    this.retryCount++;
    const delay = Math.min(
      BASE_RETRY_DELAY_MS * Math.pow(2, this.retryCount - 1),
      MAX_RETRY_DELAY_MS,
    );
    console.log(
      `[sync] Retry #${this.retryCount} in ${Math.round(delay / 1000)}s`,
    );
    this.setStatus("error");

    setTimeout(() => {
      void this.tick();
    }, delay);
  }
}

export const syncService = new SyncService();
