// =============================================================================
// SHOGUN Desktop — Renderer Process
// =============================================================================

// ---------------------------------------------------------------------------
// DOM References
// ---------------------------------------------------------------------------

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element #${id} not found`);
  return el as T;
};

const connectionDot = $<HTMLDivElement>("connectionDot");
const captureToggle = $<HTMLButtonElement>("captureToggle");
const captureLabel = $<HTMLSpanElement>("captureLabel");
const captureIndicator = $<HTMLSpanElement>("captureIndicator");
const todayCount = $<HTMLSpanElement>("todayCount");
const totalCount = $<HTMLSpanElement>("totalCount");
const recordToggle = $<HTMLButtonElement>("recordToggle");
const recordDot = $<HTMLSpanElement>("recordDot");
const recordLabel = $<HTMLSpanElement>("recordLabel");
const recordingInfo = $<HTMLDivElement>("recordingInfo");
const recordDuration = $<HTMLSpanElement>("recordDuration");
const transcriptPreview = $<HTMLDivElement>("transcriptPreview");
const syncStatus = $<HTMLSpanElement>("syncStatus");
const unsyncedCount = $<HTMLSpanElement>("unsyncedCount");
const excludedList = $<HTMLDivElement>("excludedList");
const excludedInput = $<HTMLInputElement>("excludedInput");
const addExcludedBtn = $<HTMLButtonElement>("addExcluded");

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let isCapturing = false;
let isRecording = false;
let excludedApps: string[] = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function updateConnectionDot(status: string): void {
  connectionDot.className = "connection-dot";
  if (status === "idle") {
    connectionDot.classList.add("connected");
    connectionDot.title = "Connected";
  } else if (status === "syncing") {
    connectionDot.classList.add("syncing");
    connectionDot.title = "Syncing...";
  } else if (status === "offline" || status === "error") {
    connectionDot.classList.add("disconnected");
    connectionDot.title = status === "offline" ? "Offline" : "Sync Error";
  }
}

function renderExcludedApps(): void {
  if (excludedApps.length === 0) {
    excludedList.innerHTML = '<span class="empty-message">No excluded apps</span>';
    return;
  }

  excludedList.innerHTML = excludedApps
    .map(
      (app) =>
        `<div class="excluded-item">
          <span>${escapeHtml(app)}</span>
          <button class="btn-remove" data-app="${escapeHtml(app)}" title="Remove">\u00d7</button>
        </div>`,
    )
    .join("");

  // Attach remove handlers
  excludedList.querySelectorAll(".btn-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const appName = (btn as HTMLElement).dataset.app;
      if (appName) {
        void removeExcludedApp(appName);
      }
    });
  });
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

async function toggleCapture(): Promise<void> {
  try {
    if (isCapturing) {
      await window.shogun.pauseCapture();
    } else {
      await window.shogun.resumeCapture();
    }
    isCapturing = !isCapturing;
    updateCaptureUI();
  } catch (err) {
    console.error("Failed to toggle capture:", err);
  }
}

function updateCaptureUI(): void {
  captureLabel.textContent = isCapturing ? "Active" : "Paused";
  captureIndicator.className = `toggle-indicator ${isCapturing ? "active" : "paused"}`;
}

async function toggleRecording(): Promise<void> {
  try {
    if (isRecording) {
      await window.shogun.stopRecording();
    } else {
      await window.shogun.startRecording();
    }
    isRecording = !isRecording;
    updateRecordingUI();
  } catch (err) {
    console.error("Failed to toggle recording:", err);
  }
}

function updateRecordingUI(): void {
  recordDot.className = `record-dot ${isRecording ? "recording" : ""}`;
  recordLabel.textContent = isRecording ? "Stop" : "Start";
  recordingInfo.style.display = isRecording ? "flex" : "none";
  if (!isRecording) {
    transcriptPreview.style.display = "none";
  }
}

async function addExcludedApp(): Promise<void> {
  const value = excludedInput.value.trim();
  if (!value) return;
  if (excludedApps.includes(value)) {
    excludedInput.value = "";
    return;
  }

  excludedApps.push(value);
  excludedInput.value = "";

  try {
    await window.shogun.setConfig("excludedApps", excludedApps);
  } catch (err) {
    console.error("Failed to update excluded apps:", err);
  }

  renderExcludedApps();
}

async function removeExcludedApp(appName: string): Promise<void> {
  excludedApps = excludedApps.filter((a) => a !== appName);

  try {
    await window.shogun.setConfig("excludedApps", excludedApps);
  } catch (err) {
    console.error("Failed to update excluded apps:", err);
  }

  renderExcludedApps();
}

// ---------------------------------------------------------------------------
// Status Updates (from main process)
// ---------------------------------------------------------------------------

function handleStatusUpdate(event: { type: string; data: unknown }): void {
  switch (event.type) {
    case "captureState": {
      const state = event.data as { capturing: boolean };
      isCapturing = state.capturing;
      updateCaptureUI();
      break;
    }

    case "transcriptionState": {
      const state = event.data as {
        recording: boolean;
        durationSec: number;
        preview: string;
      };
      isRecording = state.recording;
      updateRecordingUI();

      if (state.recording) {
        recordDuration.textContent = formatDuration(state.durationSec);
        if (state.preview) {
          transcriptPreview.textContent = state.preview;
          transcriptPreview.style.display = "block";
        }
      }
      break;
    }

    case "syncStatus": {
      const status = event.data as string;
      syncStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
      syncStatus.className = `sync-status ${status}`;
      updateConnectionDot(status);
      break;
    }

    case "synced":
    case "capture": {
      // Refresh stats
      void refreshStats();
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Data Refresh
// ---------------------------------------------------------------------------

async function refreshStats(): Promise<void> {
  try {
    const status = await window.shogun.getStatus();
    isCapturing = status.capturing;
    isRecording = status.recording;

    todayCount.textContent = String(status.stats.today);
    totalCount.textContent = String(status.stats.total);
    unsyncedCount.textContent = String(status.stats.unsynced);

    updateCaptureUI();
    updateRecordingUI();
    updateConnectionDot(status.syncStatus);
    syncStatus.textContent =
      status.syncStatus.charAt(0).toUpperCase() + status.syncStatus.slice(1);
    syncStatus.className = `sync-status ${status.syncStatus}`;
  } catch (err) {
    console.error("Failed to refresh stats:", err);
  }
}

async function loadConfig(): Promise<void> {
  try {
    const config = await window.shogun.getConfig();
    excludedApps = config.excludedApps || [];
    renderExcludedApps();
  } catch (err) {
    console.error("Failed to load config:", err);
  }
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

function init(): void {
  // Event listeners
  captureToggle.addEventListener("click", () => void toggleCapture());
  recordToggle.addEventListener("click", () => void toggleRecording());
  addExcludedBtn.addEventListener("click", () => void addExcludedApp());
  excludedInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") void addExcludedApp();
  });

  // Subscribe to status updates from main process
  window.shogun.onStatusUpdate(handleStatusUpdate);

  // Initial data load
  void refreshStats();
  void loadConfig();

  // Periodic refresh (every 5 seconds)
  setInterval(() => {
    void refreshStats();
  }, 5_000);
}

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
