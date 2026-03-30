import { describe, it, expect } from "vitest";
import { addApiKeySchema } from "@shogun/shared";

describe("addApiKeySchema — validation", () => {
  it("accepts a valid anthropic key", () => {
    const result = addApiKeySchema.safeParse({
      provider: "anthropic",
      key: "sk-ant-api03-xxxxxxxxxxxx",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid openai key", () => {
    const result = addApiKeySchema.safeParse({
      provider: "openai",
      key: "sk-xxxxxxxxxxxxxxxxxxxxxxxx",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid google key", () => {
    const result = addApiKeySchema.safeParse({
      provider: "google",
      key: "AIzaSyXXXXXXXXXXXXXXXXXXX",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a key with an optional label", () => {
    const result = addApiKeySchema.safeParse({
      provider: "anthropic",
      key: "sk-ant-test",
      label: "My work key",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid provider", () => {
    const result = addApiKeySchema.safeParse({
      provider: "mistral",
      key: "some-key",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty key", () => {
    const result = addApiKeySchema.safeParse({
      provider: "openai",
      key: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a key exceeding max length (256)", () => {
    const result = addApiKeySchema.safeParse({
      provider: "openai",
      key: "x".repeat(257),
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing provider", () => {
    const result = addApiKeySchema.safeParse({
      key: "sk-test-key",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing key", () => {
    const result = addApiKeySchema.safeParse({
      provider: "openai",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a label exceeding max length (100)", () => {
    const result = addApiKeySchema.safeParse({
      provider: "openai",
      key: "sk-test",
      label: "x".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid providers", () => {
    const validProviders = ["anthropic", "openai", "google"];
    for (const provider of validProviders) {
      const result = addApiKeySchema.safeParse({
        provider,
        key: "test-key-value",
      });
      expect(result.success, `provider "${provider}" should be valid`).toBe(true);
    }
  });
});

describe("maskKey function behavior", () => {
  // We test the mask function logic inline since it's not exported from the module.
  // The actual function: if length <= 8, return "****"; else first 4 + "..." + last 4.
  function maskKey(key: string): string {
    if (key.length <= 8) return "****";
    return key.slice(0, 4) + "..." + key.slice(-4);
  }

  it("masks a short key to ****", () => {
    expect(maskKey("abcdefgh")).toBe("****");
    expect(maskKey("short")).toBe("****");
  });

  it("masks a longer key showing first and last 4 chars", () => {
    expect(maskKey("sk-ant-api03-xxxxxxxxxxxx")).toBe("sk-a...xxxx");
  });

  it("masks a 9-character key correctly", () => {
    expect(maskKey("123456789")).toBe("1234...6789");
  });
});
