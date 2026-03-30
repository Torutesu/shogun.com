import { describe, it, expect } from "vitest";
import {
  handleSchema,
  sendMessageSchema,
  captureMemorySchema,
  signupSchema,
} from "../validation";

describe("handleSchema", () => {
  it("accepts valid handles", () => {
    expect(handleSchema.safeParse("john-doe").success).toBe(true);
    expect(handleSchema.safeParse("user123").success).toBe(true);
    expect(handleSchema.safeParse("abc").success).toBe(true);
    expect(handleSchema.safeParse("a1b2c3").success).toBe(true);
  });

  it("rejects handles that are too short", () => {
    expect(handleSchema.safeParse("ab").success).toBe(false);
  });

  it("rejects handles with uppercase letters", () => {
    expect(handleSchema.safeParse("JohnDoe").success).toBe(false);
  });

  it("rejects handles with invalid characters", () => {
    expect(handleSchema.safeParse("user_name").success).toBe(false);
    expect(handleSchema.safeParse("user.name").success).toBe(false);
    expect(handleSchema.safeParse("user name").success).toBe(false);
  });

  it("rejects handles starting or ending with a hyphen", () => {
    expect(handleSchema.safeParse("-user").success).toBe(false);
    expect(handleSchema.safeParse("user-").success).toBe(false);
  });

  it("rejects reserved handles", () => {
    expect(handleSchema.safeParse("admin").success).toBe(false);
    expect(handleSchema.safeParse("api").success).toBe(false);
    expect(handleSchema.safeParse("shogun").success).toBe(false);
    expect(handleSchema.safeParse("www").success).toBe(false);
  });

  it("rejects handles exceeding max length", () => {
    const longHandle = "a".repeat(31);
    expect(handleSchema.safeParse(longHandle).success).toBe(false);
  });
});

describe("sendMessageSchema", () => {
  it("accepts a valid message", () => {
    const result = sendMessageSchema.safeParse({ content: "Hello, SHOGUN!" });
    expect(result.success).toBe(true);
  });

  it("accepts a message with a model", () => {
    const result = sendMessageSchema.safeParse({
      content: "Hello",
      model: "claude-sonnet-4-20250514",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty message", () => {
    expect(sendMessageSchema.safeParse({ content: "" }).success).toBe(false);
  });

  it("rejects a missing content field", () => {
    expect(sendMessageSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an invalid model", () => {
    const result = sendMessageSchema.safeParse({
      content: "Hello",
      model: "gpt-3.5-turbo",
    });
    expect(result.success).toBe(false);
  });
});

describe("captureMemorySchema", () => {
  it("accepts a valid capture", () => {
    const result = captureMemorySchema.safeParse({
      source: "screen_capture",
      content: "User was editing index.ts in VS Code",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a capture with optional fields", () => {
    const result = captureMemorySchema.safeParse({
      source: "meeting_transcript",
      content: "Meeting notes...",
      app_name: "Zoom",
      captured_at: "2026-03-30T10:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing source", () => {
    expect(
      captureMemorySchema.safeParse({ content: "Some content" }).success,
    ).toBe(false);
  });

  it("rejects missing content", () => {
    expect(
      captureMemorySchema.safeParse({ source: "manual" }).success,
    ).toBe(false);
  });

  it("rejects empty content", () => {
    expect(
      captureMemorySchema.safeParse({ source: "chat", content: "" }).success,
    ).toBe(false);
  });

  it("rejects invalid source type", () => {
    expect(
      captureMemorySchema.safeParse({ source: "unknown", content: "data" }).success,
    ).toBe(false);
  });
});

describe("signupSchema", () => {
  it("accepts valid email and password", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "securePass1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(
      signupSchema.safeParse({ email: "not-an-email", password: "securePass1" }).success,
    ).toBe(false);
  });

  it("rejects short password", () => {
    expect(
      signupSchema.safeParse({ email: "user@example.com", password: "short" }).success,
    ).toBe(false);
  });

  it("rejects missing email", () => {
    expect(
      signupSchema.safeParse({ password: "securePass1" }).success,
    ).toBe(false);
  });

  it("rejects missing password", () => {
    expect(
      signupSchema.safeParse({ email: "user@example.com" }).success,
    ).toBe(false);
  });
});
