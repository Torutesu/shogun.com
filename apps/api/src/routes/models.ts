import { Hono } from "hono";
import { MODEL_CONFIGS, type AIModel, type AIProvider } from "@shogun/shared";
import { createServerClient } from "@shogun/db";
import type { AuthVariables } from "../middleware/auth";
import { getEnv } from "../lib/env";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const models = new Hono<{ Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// GET / - list available models + availability per user
// ---------------------------------------------------------------------------
models.get("/", async (c) => {
  const userId = c.get("userId");
  const env = getEnv();
  const supabase = createServerClient();

  // Check which providers the user has BYOK keys for
  const { data: userKeys } = await supabase
    .from("api_keys")
    .select("provider")
    .eq("user_id", userId);

  const byokProviders = new Set((userKeys ?? []).map((k) => k.provider));

  // Check which providers have platform keys
  const platformProviders = new Set<string>();
  if (env.ANTHROPIC_API_KEY) platformProviders.add("anthropic");
  if (env.OPENAI_API_KEY) platformProviders.add("openai");
  if (env.GOOGLE_AI_API_KEY) platformProviders.add("google");

  const modelList = Object.values(MODEL_CONFIGS).map((config) => ({
    ...config,
    available: byokProviders.has(config.provider) || platformProviders.has(config.provider),
    source: byokProviders.has(config.provider)
      ? ("byok" as const)
      : platformProviders.has(config.provider)
        ? ("platform" as const)
        : ("unavailable" as const),
  }));

  return c.json({ models: modelList });
});

// ---------------------------------------------------------------------------
// GET /active - get user's active model
// ---------------------------------------------------------------------------
models.get("/active", async (c) => {
  const userId = c.get("userId");
  const supabase = createServerClient();

  const { data } = await supabase
    .from("user_settings")
    .select("active_model")
    .eq("user_id", userId)
    .single();

  const activeModel = (data?.active_model as AIModel) ?? "claude-sonnet-4-20250514";
  const config = MODEL_CONFIGS[activeModel];

  return c.json({ model: activeModel, config });
});

// ---------------------------------------------------------------------------
// PUT /active - set active model
// ---------------------------------------------------------------------------
models.put(
  "/active",
  zValidator(
    "json",
    z.object({
      model: z.enum([
        "claude-sonnet-4-20250514",
        "claude-opus-4-20250514",
        "gpt-4o",
        "gpt-4o-mini",
        "gemini-2.0-flash",
        "gemini-2.5-pro",
      ]),
    }),
  ),
  async (c) => {
    const userId = c.get("userId");
    const { model } = c.req.valid("json");
    const supabase = createServerClient();

    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: userId, active_model: model }, { onConflict: "user_id" });

    if (error) {
      return c.json({ error: { code: "UPDATE_FAILED", message: error.message, status: 500 } }, 500);
    }

    const config = MODEL_CONFIGS[model];
    return c.json({ model, config });
  },
);

export default models;
