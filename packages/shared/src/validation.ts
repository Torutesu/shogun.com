import { z } from "zod";
import { HANDLE_REGEX, RESERVED_HANDLES } from "./constants";

// Auth
export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Profile
export const handleSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(HANDLE_REGEX, "Handle must be lowercase alphanumeric with hyphens, 3-30 chars")
  .refine((h) => !RESERVED_HANDLES.includes(h), "This handle is reserved");

export const updateProfileSchema = z.object({
  display_name: z.string().max(100).optional(),
  locale: z.enum(["en", "ja", "es"]).optional(),
  timezone: z.string().max(50).optional(),
  communication_style: z.string().max(500).optional(),
});

// Chat
export const sendMessageSchema = z.object({
  content: z.string().min(1).max(100000),
  model: z
    .enum([
      "claude-sonnet-4-20250514",
      "claude-opus-4-20250514",
      "gpt-4o",
      "gpt-4o-mini",
      "gemini-2.0-flash",
      "gemini-2.5-pro",
    ])
    .optional(),
});

export const createConversationSchema = z.object({
  title: z.string().max(200).optional(),
  model: z
    .enum([
      "claude-sonnet-4-20250514",
      "claude-opus-4-20250514",
      "gpt-4o",
      "gpt-4o-mini",
      "gemini-2.0-flash",
      "gemini-2.5-pro",
    ])
    .optional(),
  system_prompt: z.string().max(10000).optional(),
});

// Memory
export const captureMemorySchema = z.object({
  source: z.enum(["screen_capture", "meeting_transcript", "chat", "file", "manual"]),
  content: z.string().min(1).max(50000),
  app_name: z.string().max(100).optional(),
  captured_at: z.string().datetime().optional(),
});

export const searchMemorySchema = z.object({
  query: z.string().min(1).max(1000),
  limit: z.number().int().min(1).max(100).optional(),
  source: z.enum(["screen_capture", "meeting_transcript", "chat", "file", "manual"]).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
});

// Files
export const fileWriteSchema = z.object({
  path: z.string().min(1).max(4096),
  content: z.string().max(10_000_000),
});

// Services
export const createServiceSchema = z.object({
  name: z.string().min(1).max(63).regex(/^[a-z0-9-]+$/),
  port: z.number().int().min(1).max(65535),
  subdomain: z
    .string()
    .min(1)
    .max(63)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  custom_domain: z.string().max(253).optional(),
});

// Automations
export const createAutomationSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  trigger_type: z.enum(["cron", "email", "sms", "line", "webhook"]),
  trigger_config: z.record(z.unknown()),
  command: z.string().min(1).max(10000),
});

// API Keys (BYOK)
export const addApiKeySchema = z.object({
  provider: z.enum(["anthropic", "openai", "google"]),
  key: z.string().min(1).max(256),
  label: z.string().max(100).optional(),
});

// Notification channels
export const addChannelSchema = z.object({
  channel: z.enum(["sms", "line", "email"]),
  identifier: z.string().min(1).max(256),
});
