import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { captureMemorySchema, searchMemorySchema, parseTimeExpression } from "@shogun/shared";
import { createServerClient } from "@shogun/db";
import { MemoryService } from "@shogun/memory";
import type { AuthVariables } from "../middleware/auth";
import { getEnv } from "../lib/env";
import { z } from "zod";

const memory = new Hono<{ Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMemoryService(supabase: ReturnType<typeof createServerClient>): MemoryService {
  const env = getEnv();
  return new MemoryService({
    supabase,
    generateEmbedding: async (text: string) => {
      const res = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
      });
      const data = (await res.json()) as { data: Array<{ embedding: number[] }> };
      return data.data[0]?.embedding ?? [];
    },
    generateSummary: async (text: string) => {
      // Use a cheap model to summarize
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "Summarize the following content in 1-2 sentences." },
              { role: "user", content: text.slice(0, 4000) },
            ],
            max_tokens: 150,
          }),
        });
        const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
        return data.choices[0]?.message.content ?? "";
      } catch {
        return "";
      }
    },
  });
}

// ---------------------------------------------------------------------------
// GET / - list recent memory entries (paginated)
// ---------------------------------------------------------------------------
memory.get("/", async (c) => {
  const userId = c.get("userId");
  const supabase = createServerClient();
  const limit = Math.min(Number(c.req.query("limit")) || 50, 100);
  const offset = Number(c.req.query("offset")) || 0;
  const source = c.req.query("source");

  let query = supabase
    .from("memory_entries")
    .select("id, source, content, summary, app_name, captured_at, created_at", { count: "exact" })
    .eq("user_id", userId)
    .order("captured_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (source) {
    query = query.eq("source", source);
  }

  const { data, error, count } = await query;

  if (error) {
    return c.json({ error: { code: "FETCH_FAILED", message: error.message, status: 500 } }, 500);
  }

  return c.json({ entries: data, total: count });
});

// ---------------------------------------------------------------------------
// POST /capture - capture new entry
// ---------------------------------------------------------------------------
memory.post("/capture", zValidator("json", captureMemorySchema), async (c) => {
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const supabase = createServerClient();
  const service = createMemoryService(supabase);

  try {
    const id = await service.capture({
      userId,
      source: body.source,
      content: body.content,
      appName: body.app_name,
      capturedAt: body.captured_at,
    });
    return c.json({ id }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Capture failed";
    if (message.includes("excluded")) {
      return c.json({ error: { code: "APP_EXCLUDED", message, status: 422 } }, 422);
    }
    return c.json({ error: { code: "CAPTURE_FAILED", message, status: 500 } }, 500);
  }
});

// ---------------------------------------------------------------------------
// DELETE /:id - delete memory entry
// ---------------------------------------------------------------------------
memory.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const supabase = createServerClient();
  const service = createMemoryService(supabase);

  try {
    await service.deleteEntry(userId, id);
    return c.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return c.json({ error: { code: "DELETE_FAILED", message, status: 500 } }, 500);
  }
});

// ---------------------------------------------------------------------------
// GET /export - export memory entries as JSON or CSV
// ---------------------------------------------------------------------------
memory.get("/export", async (c) => {
  const userId = c.get("userId");
  const supabase = createServerClient();

  const format = c.req.query("format") ?? "json";
  const from = c.req.query("from");
  const to = c.req.query("to");

  let query = supabase
    .from("memory_entries")
    .select("id, source, content, summary, app_name, captured_at, created_at")
    .eq("user_id", userId)
    .order("captured_at", { ascending: false });

  if (from) query = query.gte("captured_at", from);
  if (to) query = query.lte("captured_at", to);

  const { data, error } = await query;

  if (error) {
    return c.json({ error: { code: "EXPORT_FAILED", message: error.message, status: 500 } }, 500);
  }

  const entries = data ?? [];

  if (format === "csv") {
    const header = "id,source,app_name,summary,captured_at,created_at,content";
    const escapeCSV = (val: string | null | undefined) => {
      if (val == null) return "";
      const s = String(val).replace(/"/g, '""');
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
    };
    const rows = entries.map((e) =>
      [e.id, e.source, e.app_name, e.summary, e.captured_at, e.created_at, e.content]
        .map(escapeCSV)
        .join(","),
    );
    const csv = [header, ...rows].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=memory-export.csv",
      },
    });
  }

  // Default: JSON
  return c.json({ entries });
});

// ---------------------------------------------------------------------------
// POST /search - semantic search
// ---------------------------------------------------------------------------
memory.post("/search", zValidator("json", searchMemorySchema), async (c) => {
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const supabase = createServerClient();
  const service = createMemoryService(supabase);

  // Parse time expressions from the query before searching
  const timeRange = parseTimeExpression(body.query);
  const dateFrom = body.date_from ?? (timeRange.from ? timeRange.from.toISOString() : undefined);
  const dateTo = body.date_to ?? (timeRange.to ? timeRange.to.toISOString() : undefined);

  try {
    const results = await service.search({
      userId,
      query: body.query,
      limit: body.limit,
      source: body.source,
      dateFrom,
      dateTo,
    });
    return c.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return c.json({ error: { code: "SEARCH_FAILED", message, status: 500 } }, 500);
  }
});

// ---------------------------------------------------------------------------
// GET /settings - get memory preferences
// ---------------------------------------------------------------------------
memory.get("/settings", async (c) => {
  const userId = c.get("userId");
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("memory_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    // Return defaults
    return c.json({
      settings: {
        screen_capture_enabled: true,
        capture_interval_seconds: 30,
        auto_summarize: true,
        retention_days: 90,
      },
    });
  }

  return c.json({ settings: data });
});

// ---------------------------------------------------------------------------
// PATCH /settings - update memory preferences
// ---------------------------------------------------------------------------
memory.patch(
  "/settings",
  zValidator(
    "json",
    z.object({
      screen_capture_enabled: z.boolean().optional(),
      capture_interval_seconds: z.number().int().min(10).max(300).optional(),
      auto_summarize: z.boolean().optional(),
      retention_days: z.number().int().min(1).max(365).optional(),
    }),
  ),
  async (c) => {
    const userId = c.get("userId");
    const updates = c.req.valid("json");
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("memory_settings")
      .upsert({ user_id: userId, ...updates }, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      return c.json({ error: { code: "UPDATE_FAILED", message: error.message, status: 500 } }, 500);
    }

    return c.json({ settings: data });
  },
);

// ---------------------------------------------------------------------------
// GET /exclusions - list excluded apps
// ---------------------------------------------------------------------------
memory.get("/exclusions", async (c) => {
  const userId = c.get("userId");
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("memory_exclusions")
    .select("id, app_name, created_at")
    .eq("user_id", userId)
    .order("app_name");

  if (error) {
    return c.json({ error: { code: "FETCH_FAILED", message: error.message, status: 500 } }, 500);
  }

  return c.json({ exclusions: data ?? [] });
});

// ---------------------------------------------------------------------------
// POST /exclusions - add app exclusion
// ---------------------------------------------------------------------------
memory.post(
  "/exclusions",
  zValidator("json", z.object({ app_name: z.string().min(1).max(100) })),
  async (c) => {
    const userId = c.get("userId");
    const { app_name } = c.req.valid("json");
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("memory_exclusions")
      .insert({ user_id: userId, app_name })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return c.json({ error: { code: "ALREADY_EXCLUDED", message: "App is already excluded", status: 409 } }, 409);
      }
      return c.json({ error: { code: "CREATE_FAILED", message: error.message, status: 500 } }, 500);
    }

    return c.json({ exclusion: data }, 201);
  },
);

// ---------------------------------------------------------------------------
// DELETE /exclusions/:app - remove app exclusion
// ---------------------------------------------------------------------------
memory.delete("/exclusions/:app", async (c) => {
  const userId = c.get("userId");
  const appName = c.req.param("app");
  const supabase = createServerClient();

  const { error } = await supabase
    .from("memory_exclusions")
    .delete()
    .eq("user_id", userId)
    .eq("app_name", appName);

  if (error) {
    return c.json({ error: { code: "DELETE_FAILED", message: error.message, status: 500 } }, 500);
  }

  return c.json({ success: true });
});

export default memory;
