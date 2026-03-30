// =============================================================================
// SHOGUN Desktop — Meeting Audio Capture + Whisper Transcription
// =============================================================================

import { desktopCapturer, BrowserWindow } from "electron";
import { EventEmitter } from "node:events";
import { get as getConfigValue } from "./config";
import { insert } from "./store";
import type { MemorySource } from "@shogun/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TranscriptionState {
  recording: boolean;
  durationSec: number;
  preview: string;
}

// ---------------------------------------------------------------------------
// Transcription Service
// ---------------------------------------------------------------------------

const CHUNK_DURATION_MS = 30_000; // 30 seconds
const MAX_TRANSCRIPT_BYTES = 500 * 1024; // 500KB
const TRIM_TRANSCRIPT_BYTES = 400 * 1024; // Keep last 400KB when trimming

class TranscriptionService extends EventEmitter {
  private _recording = false;
  private startTime = 0;
  private durationTimer: ReturnType<typeof setInterval> | null = null;
  private fullTranscript = "";
  private hiddenWindow: BrowserWindow | null = null;

  get recording(): boolean {
    return this._recording;
  }

  get durationSec(): number {
    if (!this._recording || this.startTime === 0) return 0;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  get preview(): string {
    // Return last 200 chars as preview
    if (this.fullTranscript.length <= 200) return this.fullTranscript;
    return "..." + this.fullTranscript.slice(-200);
  }

  async start(): Promise<void> {
    if (this._recording) return;

    try {
      this._recording = true;
      this.startTime = Date.now();
      this.fullTranscript = "";

      // Start duration tracking for UI updates
      this.durationTimer = setInterval(() => {
        this.emitState();
      }, 1000);

      // We need a hidden renderer window to use MediaRecorder + desktopCapturer
      // audio. The main process cannot directly access MediaRecorder.
      this.hiddenWindow = new BrowserWindow({
        show: false,
        width: 1,
        height: 1,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      // Load a data URL with the recording logic
      const recorderHTML = this.buildRecorderHTML();
      await this.hiddenWindow.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(recorderHTML)}`,
      );

      // Listen for audio chunks from the hidden window via IPC
      // The hidden window posts messages that we capture via webContents
      this.hiddenWindow.webContents.on(
        "console-message",
        (_event, _level, message) => {
          void this.handleRecorderMessage(message);
        },
      );

      this.emitState();
      console.log("[transcription] Recording started");
    } catch (err) {
      console.error("[transcription] Failed to start:", err);
      this._recording = false;
      this.cleanup();
    }
  }

  async stop(): Promise<void> {
    if (!this._recording) return;

    this._recording = false;
    this.cleanup();

    // Store full transcript as memory entry
    if (this.fullTranscript.trim().length > 20) {
      const source: MemorySource = "meeting_transcript";
      insert({
        source,
        content: this.fullTranscript.trim(),
        appName: "Meeting",
        windowTitle: `Meeting transcript (${Math.floor((Date.now() - this.startTime) / 1000)}s)`,
      });
      console.log("[transcription] Transcript saved to store");
    }

    this.emitState();
    console.log("[transcription] Recording stopped");
  }

  private cleanup(): void {
    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = null;
    }
    if (this.hiddenWindow && !this.hiddenWindow.isDestroyed()) {
      this.hiddenWindow.close();
      this.hiddenWindow = null;
    }
  }

  private async handleRecorderMessage(message: string): Promise<void> {
    // Messages from the hidden window are prefixed with SHOGUN_AUDIO:
    if (!message.startsWith("SHOGUN_AUDIO:")) return;

    const payload = message.slice("SHOGUN_AUDIO:".length);

    if (payload.startsWith("CHUNK:")) {
      // Base64 encoded audio chunk
      const base64 = payload.slice("CHUNK:".length);
      await this.transcribeChunk(base64);
    } else if (payload === "ERROR") {
      console.error("[transcription] Recorder error in hidden window");
    } else if (payload === "STOPPED") {
      // Recording ended naturally
    }
  }

  private async transcribeChunk(base64Audio: string): Promise<void> {
    try {
      const apiUrl = getConfigValue("apiUrl");
      const authToken = getConfigValue("authToken");

      if (!authToken) {
        console.warn("[transcription] No auth token, skipping Whisper API call");
        return;
      }

      // Convert base64 to buffer
      const audioBuffer = Buffer.from(base64Audio, "base64");

      // Create form data with the audio blob
      const boundary = `----ShogunBoundary${Date.now()}`;
      const header = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="audio"; filename="chunk.webm"',
        "Content-Type: audio/webm",
        "",
      ].join("\r\n");
      const footer = `\r\n--${boundary}--\r\n`;

      const headerBuf = Buffer.from(header + "\r\n");
      const footerBuf = Buffer.from(footer);
      const body = Buffer.concat([headerBuf, audioBuffer, footerBuf]);

      const response = await fetch(`${apiUrl}/memory/transcribe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
        body,
      });

      if (!response.ok) {
        console.error(
          `[transcription] Whisper API error: ${response.status}`,
        );
        return;
      }

      const result = (await response.json()) as { text?: string };
      if (result.text && result.text.trim().length > 0) {
        this.fullTranscript += (this.fullTranscript ? " " : "") + result.text.trim();
        // Prevent unbounded growth for long meetings
        if (this.fullTranscript.length > MAX_TRANSCRIPT_BYTES) {
          this.fullTranscript = this.fullTranscript.slice(-TRIM_TRANSCRIPT_BYTES);
        }
        this.emitState();
      }
    } catch (err) {
      console.error("[transcription] Transcribe chunk error:", err);
    }
  }

  private buildRecorderHTML(): string {
    // Inline HTML/JS that runs in the hidden BrowserWindow.
    // It uses navigator.mediaDevices.getUserMedia with desktopCapturer
    // to capture system audio and splits it into 30s chunks.
    return `<!DOCTYPE html>
<html><head><title>SHOGUN Audio Capture</title></head>
<body><script>
(async function() {
  try {
    // Request system audio via display media
    const stream = await navigator.mediaDevices.getDisplayMedia({
      audio: true,
      video: { width: 1, height: 1 }
    });

    // Remove video tracks, we only need audio
    stream.getVideoTracks().forEach(t => t.stop());

    const audioStream = new MediaStream(stream.getAudioTracks());
    if (audioStream.getAudioTracks().length === 0) {
      console.log("SHOGUN_AUDIO:ERROR");
      return;
    }

    const CHUNK_MS = ${CHUNK_DURATION_MS};
    let recorder = null;

    function startChunk() {
      const chunks = [];
      recorder = new MediaRecorder(audioStream, {
        mimeType: "audio/webm;codecs=opus"
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        if (chunks.length === 0) return;
        const blob = new Blob(chunks, { type: "audio/webm" });
        const buf = await blob.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buf).reduce((data, byte) => data + String.fromCharCode(byte), "")
        );
        console.log("SHOGUN_AUDIO:CHUNK:" + base64);

        // Start next chunk if still recording
        if (audioStream.active && audioStream.getAudioTracks().some(t => t.readyState === "live")) {
          startChunk();
        }
      };

      recorder.start();
      setTimeout(() => {
        if (recorder && recorder.state === "recording") {
          recorder.stop();
        }
      }, CHUNK_MS);
    }

    startChunk();
  } catch(err) {
    console.log("SHOGUN_AUDIO:ERROR");
  }
})();
</script></body></html>`;
  }

  private emitState(): void {
    const state: TranscriptionState = {
      recording: this._recording,
      durationSec: this.durationSec,
      preview: this.preview,
    };
    this.emit("stateChange", state);
  }
}

export const transcriptionService = new TranscriptionService();
