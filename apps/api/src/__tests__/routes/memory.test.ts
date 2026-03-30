import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  captureMemorySchema,
  searchMemorySchema,
} from "@shogun/shared";

describe("captureMemorySchema — validation", () => {
  it("accepts a valid capture with required fields", () => {
    const result = captureMemorySchema.safeParse({
      source: "screen_capture",
      content: "User was editing index.ts in VS Code",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid source types", () => {
    const validSources = [
      "screen_capture",
      "meeting_transcript",
      "chat",
      "file",
      "manual",
    ];
    for (const source of validSources) {
      const result = captureMemorySchema.safeParse({
        source,
        content: "Test content",
      });
      expect(result.success, `source "${source}" should be valid`).toBe(true);
    }
  });

  it("accepts optional fields (app_name, captured_at)", () => {
    const result = captureMemorySchema.safeParse({
      source: "meeting_transcript",
      content: "Meeting notes from standup",
      app_name: "Zoom",
      captured_at: "2026-03-30T10:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid source type", () => {
    const result = captureMemorySchema.safeParse({
      source: "unknown_source",
      content: "Some content",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing source", () => {
    const result = captureMemorySchema.safeParse({
      content: "Some content",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing content", () => {
    const result = captureMemorySchema.safeParse({
      source: "manual",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty content", () => {
    const result = captureMemorySchema.safeParse({
      source: "chat",
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects content exceeding max length", () => {
    const result = captureMemorySchema.safeParse({
      source: "manual",
      content: "x".repeat(50001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid captured_at format", () => {
    const result = captureMemorySchema.safeParse({
      source: "manual",
      content: "Test",
      captured_at: "not-a-datetime",
    });
    expect(result.success).toBe(false);
  });
});

describe("searchMemorySchema — validation", () => {
  it("accepts a valid search with only query", () => {
    const result = searchMemorySchema.safeParse({
      query: "What did I work on yesterday?",
    });
    expect(result.success).toBe(true);
  });

  it("accepts search with all optional fields", () => {
    const result = searchMemorySchema.safeParse({
      query: "deployment",
      limit: 20,
      source: "chat",
      date_from: "2026-03-01T00:00:00Z",
      date_to: "2026-03-30T23:59:59Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty query", () => {
    const result = searchMemorySchema.safeParse({
      query: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing query", () => {
    const result = searchMemorySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects query exceeding max length", () => {
    const result = searchMemorySchema.safeParse({
      query: "x".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid source filter", () => {
    const result = searchMemorySchema.safeParse({
      query: "test",
      source: "invalid_source",
    });
    expect(result.success).toBe(false);
  });

  it("rejects limit below minimum", () => {
    const result = searchMemorySchema.safeParse({
      query: "test",
      limit: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects limit above maximum", () => {
    const result = searchMemorySchema.safeParse({
      query: "test",
      limit: 101,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format for date_from", () => {
    const result = searchMemorySchema.safeParse({
      query: "test",
      date_from: "March 2026",
    });
    expect(result.success).toBe(false);
  });
});

describe("memory settings update — inline schema", () => {
  // The memory settings update uses an inline z.object in the route,
  // so we replicate it here to test the validation rules.
  const memorySettingsSchema = z.object({
    screen_capture_enabled: z.boolean().optional(),
    capture_interval_seconds: z.number().int().min(10).max(300).optional(),
    auto_summarize: z.boolean().optional(),
    retention_days: z.number().int().min(1).max(365).optional(),
  });

  it("accepts valid settings", () => {
    const result = memorySettingsSchema.safeParse({
      screen_capture_enabled: true,
      capture_interval_seconds: 30,
      auto_summarize: false,
      retention_days: 90,
    });
    expect(result.success).toBe(true);
  });

  it("accepts partial updates", () => {
    const result = memorySettingsSchema.safeParse({
      retention_days: 180,
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object (all optional)", () => {
    const result = memorySettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects capture_interval_seconds below minimum (10)", () => {
    const result = memorySettingsSchema.safeParse({
      capture_interval_seconds: 5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects capture_interval_seconds above maximum (300)", () => {
    const result = memorySettingsSchema.safeParse({
      capture_interval_seconds: 500,
    });
    expect(result.success).toBe(false);
  });

  it("rejects retention_days below minimum (1)", () => {
    const result = memorySettingsSchema.safeParse({
      retention_days: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects retention_days above maximum (365)", () => {
    const result = memorySettingsSchema.safeParse({
      retention_days: 400,
    });
    expect(result.success).toBe(false);
  });
});
