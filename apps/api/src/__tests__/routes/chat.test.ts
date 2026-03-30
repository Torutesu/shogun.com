import { describe, it, expect } from "vitest";
import {
  createConversationSchema,
  sendMessageSchema,
} from "@shogun/shared";

describe("createConversationSchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    const result = createConversationSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts a valid title", () => {
    const result = createConversationSchema.safeParse({
      title: "My conversation",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid model", () => {
    const result = createConversationSchema.safeParse({
      model: "claude-sonnet-4-20250514",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid system prompt", () => {
    const result = createConversationSchema.safeParse({
      system_prompt: "You are a helpful assistant.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid model", () => {
    const result = createConversationSchema.safeParse({
      model: "gpt-3.5-turbo",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a title that is too long", () => {
    const result = createConversationSchema.safeParse({
      title: "x".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a system prompt that is too long", () => {
    const result = createConversationSchema.safeParse({
      system_prompt: "x".repeat(10001),
    });
    expect(result.success).toBe(false);
  });
});

describe("sendMessageSchema", () => {
  it("accepts a valid message", () => {
    const result = sendMessageSchema.safeParse({ content: "Hello" });
    expect(result.success).toBe(true);
  });

  it("accepts a message with a valid model", () => {
    const result = sendMessageSchema.safeParse({
      content: "Hello",
      model: "gpt-4o",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = sendMessageSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing content", () => {
    const result = sendMessageSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects an invalid model", () => {
    const result = sendMessageSchema.safeParse({
      content: "Hello",
      model: "llama-3",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid model options", () => {
    const validModels = [
      "claude-sonnet-4-20250514",
      "claude-opus-4-20250514",
      "gpt-4o",
      "gpt-4o-mini",
      "gemini-2.0-flash",
      "gemini-2.5-pro",
    ];
    for (const model of validModels) {
      const result = sendMessageSchema.safeParse({ content: "test", model });
      expect(result.success, `model ${model} should be valid`).toBe(true);
    }
  });
});
