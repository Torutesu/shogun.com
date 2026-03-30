import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { addApiKeySchema, type AIProvider } from "@shogun/shared";
import { createServerClient } from "@shogun/db";
import { createAIClient } from "@shogun/ai";
import type { AuthVariables } from "../middleware/auth";
import { getEnv } from "../lib/env";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const keys = new Hono<{ Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// Encryption helpers
// ---------------------------------------------------------------------------

function getEncryptionKey(): Buffer {
  const env = getEnv();
  return Buffer.from(env.ENCRYPTION_KEY, "hex").subarray(0, 32);
}

function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const [ivHex, encHex] = ciphertext.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encHex, "hex");
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 4) + "..." + key.slice(-4);
}

// ---------------------------------------------------------------------------
// GET / - list API keys (masked)
// ---------------------------------------------------------------------------
keys.get("/", async (c) => {
  const userId = c.get("userId");
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("api_keys")
    .select("provider, label, created_at, updated_at")
    .eq("user_id", userId)
    .order("provider");

  if (error) {
    return c.json({ error: { code: "FETCH_FAILED", message: error.message, status: 500 } }, 500);
  }

  return c.json({ keys: data ?? [] });
});

// ---------------------------------------------------------------------------
// POST / - add API key (encrypted)
// ---------------------------------------------------------------------------
keys.post("/", zValidator("json", addApiKeySchema), async (c) => {
  const userId = c.get("userId");
  const { provider, key, label } = c.req.valid("json");
  const supabase = createServerClient();

  const encryptedKey = encrypt(key);
  const masked = maskKey(key);

  const { data, error } = await supabase
    .from("api_keys")
    .upsert(
      {
        user_id: userId,
        provider,
        encrypted_key: encryptedKey,
        key_masked: masked,
        label: label ?? null,
      },
      { onConflict: "user_id,provider" },
    )
    .select("provider, label, created_at, updated_at")
    .single();

  if (error) {
    return c.json({ error: { code: "SAVE_FAILED", message: error.message, status: 500 } }, 500);
  }

  return c.json({ key: data }, 201);
});

// ---------------------------------------------------------------------------
// DELETE /:provider - remove API key
// ---------------------------------------------------------------------------
keys.delete("/:provider", async (c) => {
  const userId = c.get("userId");
  const provider = c.req.param("provider");
  const supabase = createServerClient();

  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("user_id", userId)
    .eq("provider", provider);

  if (error) {
    return c.json({ error: { code: "DELETE_FAILED", message: error.message, status: 500 } }, 500);
  }

  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// POST /:provider/test - validate API key
// ---------------------------------------------------------------------------
keys.post("/:provider/test", async (c) => {
  const userId = c.get("userId");
  const provider = c.req.param("provider") as AIProvider;
  const supabase = createServerClient();

  // Check if there's a key provided in body, otherwise use stored key
  let apiKey: string;
  try {
    const body = await c.req.json<{ key?: string }>();
    if (body.key) {
      apiKey = body.key;
    } else {
      const { data } = await supabase
        .from("api_keys")
        .select("encrypted_key")
        .eq("user_id", userId)
        .eq("provider", provider)
        .single();

      if (!data) {
        return c.json({ error: { code: "NO_KEY", message: "No API key found for this provider", status: 404 } }, 404);
      }
      apiKey = decrypt(data.encrypted_key);
    }
  } catch {
    const { data } = await supabase
      .from("api_keys")
      .select("encrypted_key")
      .eq("user_id", userId)
      .eq("provider", provider)
      .single();

    if (!data) {
      return c.json({ error: { code: "NO_KEY", message: "No API key found for this provider", status: 404 } }, 404);
    }
    apiKey = decrypt(data.encrypted_key);
  }

  // Test the key by making a minimal API call
  try {
    const testModel = (() => {
      switch (provider) {
        case "anthropic": return "claude-sonnet-4-20250514" as const;
        case "openai": return "gpt-4o-mini" as const;
        case "google": return "gemini-2.0-flash" as const;
      }
    })();

    const client = createAIClient({ provider, apiKey });
    let receivedResponse = false;

    await client.stream({
      model: testModel,
      messages: [{ role: "user", content: "Say hi" }],
      onEvent: (event) => {
        if (event.type === "delta" || event.type === "done") {
          receivedResponse = true;
        }
      },
    });

    return c.json({ valid: receivedResponse });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Key validation failed";
    return c.json({ valid: false, error: message });
  }
});

export default keys;
