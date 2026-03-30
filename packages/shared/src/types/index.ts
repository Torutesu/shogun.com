// =============================================================================
// SHOGUN — Shared Type Definitions
// =============================================================================

// Locale
export type Locale = "en" | "ja" | "es";
export const LOCALES = ["en", "ja", "es"] as const;
export const DEFAULT_LOCALE: Locale = "en";

// Subscription
export type SubscriptionTier = "free" | "basic" | "pro" | "ultra";

// AI
export type AIProvider = "anthropic" | "openai" | "google";

export type AIModel =
  | "claude-sonnet-4-20250514"
  | "claude-opus-4-20250514"
  | "gpt-4o"
  | "gpt-4o-mini"
  | "gemini-2.0-flash"
  | "gemini-2.5-pro";

export type ChatRole = "user" | "assistant" | "system" | "tool";

// Machine
export type MachineStatus =
  | "provisioning"
  | "running"
  | "sleeping"
  | "stopped"
  | "error";

// Memory
export type MemorySource =
  | "screen_capture"
  | "meeting_transcript"
  | "chat"
  | "file"
  | "manual";

// Automation
export type AutomationTrigger = "cron" | "email" | "sms" | "line" | "webhook";
export type AutomationStatus = "active" | "paused" | "error" | "completed";

// Service
export type ServiceStatus = "deploying" | "running" | "stopped" | "error";

// Chat message
export interface ChatMessage {
  id: string;
  conversationId: string;
  role: ChatRole;
  content: string;
  model?: AIModel;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  tokenInput?: number;
  tokenOutput?: number;
  costCents?: number;
  createdAt: string;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  output: string;
  isError?: boolean;
}

// Streaming events
export type StreamEvent =
  | { type: "delta"; content: string }
  | { type: "tool_call"; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; name: string; output: string; isError?: boolean }
  | { type: "done"; usage: { inputTokens: number; outputTokens: number; costCents: number } }
  | { type: "error"; message: string };

// User profile
export interface UserProfile {
  id: string;
  handle: string;
  displayName?: string;
  avatarUrl?: string;
  locale: Locale;
  timezone: string;
  communicationStyle?: string;
  createdAt: string;
  updatedAt: string;
}

// Machine
export interface Machine {
  id: string;
  userId: string;
  flyMachineId?: string;
  flyAppName?: string;
  region: string;
  status: MachineStatus;
  cpuCores: number;
  memoryMb: number;
  storageGb: number;
  ipAddress?: string;
  lastActiveAt?: string;
  createdAt: string;
}

// Memory entry
export interface MemoryEntry {
  id: string;
  userId: string;
  source: MemorySource;
  content: string;
  summary?: string;
  appName?: string;
  capturedAt: string;
  similarity?: number;
}

// File entry
export interface FileEntry {
  name: string;
  type: "file" | "directory";
  size?: number;
  modified: string;
}

// API error
export interface APIError {
  code: string;
  message: string;
  status: number;
}
