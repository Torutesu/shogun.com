import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { streamSSE } from "hono/streaming";
import {
  sendMessageSchema,
  createConversationSchema,
  MODEL_CONFIGS,
  type AIModel,
  type StreamEvent,
  type ToolCall,
  type ToolResult,
} from "@shogun/shared";
import { createServerClient } from "@shogun/db";
import { createAIClient, TOOL_DEFINITIONS } from "@shogun/ai";
import { MemoryService } from "@shogun/memory";
import type { AuthVariables } from "../middleware/auth";
import { getEnv } from "../lib/env";
import { decrypt } from "./keys";

const chat = new Hono<{ Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getActiveModel(supabase: ReturnType<typeof createServerClient>, userId: string): Promise<AIModel> {
  const { data } = await supabase
    .from("user_settings")
    .select("active_model")
    .eq("user_id", userId)
    .single();
  return (data?.active_model as AIModel) ?? "claude-sonnet-4-20250514";
}

async function getUserApiKey(supabase: ReturnType<typeof createServerClient>, userId: string, provider: string): Promise<string | null> {
  const { data } = await supabase
    .from("api_keys")
    .select("encrypted_key")
    .eq("user_id", userId)
    .eq("provider", provider)
    .single();
  if (!data?.encrypted_key) return null;
  return decrypt(data.encrypted_key);
}

function calculateCost(model: AIModel, inputTokens: number, outputTokens: number): number {
  const config = MODEL_CONFIGS[model];
  return (inputTokens / 1000) * config.inputPricePer1k + (outputTokens / 1000) * config.outputPricePer1k;
}

async function callAgent(machineId: string, path: string, method: string, body?: unknown): Promise<unknown> {
  if (!/^[a-z0-9-]+$/.test(machineId)) {
    throw new Error("Invalid machine ID format");
  }
  const agentUrl = `http://${machineId}.vm.flycast:9000${path}`;
  const res = await fetch(agentUrl, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function executeToolCall(
  userId: string,
  machineId: string | null,
  toolName: string,
  input: Record<string, unknown>,
  supabase: ReturnType<typeof createServerClient>,
): Promise<string> {
  switch (toolName) {
    case "shell_exec": {
      if (!machineId) return JSON.stringify({ error: "No machine available" });
      const command = String(input.command ?? "");
      if (command.length > 10000) {
        return JSON.stringify({ error: "Command exceeds maximum length of 10000 characters" });
      }
      const timeoutMs = input.timeout_ms != null ? Math.min(Math.max(Number(input.timeout_ms), 100), 300000) : undefined;
      const workingDir = input.working_directory != null ? String(input.working_directory) : undefined;
      if (workingDir && !/^\/[\w./ -]*$/.test(workingDir)) {
        return JSON.stringify({ error: "Invalid working directory format" });
      }
      const result = await callAgent(machineId, "/exec", "POST", {
        command,
        working_directory: workingDir,
        timeout_ms: timeoutMs,
      });
      return JSON.stringify(result);
    }
    case "file_read": {
      if (!machineId) return JSON.stringify({ error: "No machine available" });
      const result = await callAgent(machineId, `/files/read?path=${encodeURIComponent(String(input.path))}`, "GET");
      return JSON.stringify(result);
    }
    case "file_write": {
      if (!machineId) return JSON.stringify({ error: "No machine available" });
      const result = await callAgent(machineId, "/files/write", "POST", {
        path: input.path,
        content: input.content,
      });
      return JSON.stringify(result);
    }
    case "file_list": {
      if (!machineId) return JSON.stringify({ error: "No machine available" });
      const path = input.path ?? "/home/user";
      const result = await callAgent(machineId, `/files?path=${encodeURIComponent(String(path))}`, "GET");
      return JSON.stringify(result);
    }
    case "memory_query": {
      const env = getEnv();
      const memoryService = new MemoryService({
        supabase,
        generateEmbedding: async (text: string) => {
          // Use OpenAI embeddings
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
        generateSummary: async () => "",
      });
      const results = await memoryService.search({
        userId,
        query: String(input.query),
        limit: Number(input.limit) || 10,
        source: input.source as any,
      });
      return JSON.stringify(results);
    }
    case "web_search": {
      const query = String(input.query || "").trim();
      if (!query) return JSON.stringify({ error: "Empty search query" });

      const searchApiKey = process.env.BRAVE_SEARCH_API_KEY;
      if (!searchApiKey) {
        // Fallback: use DuckDuckGo instant answer API (no key needed)
        const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
        const res = await fetch(ddgUrl);
        const data = await res.json();
        return JSON.stringify({
          results: data.RelatedTopics?.slice(0, 5).map((t: any) => ({
            title: t.Text?.split(" - ")[0] || "",
            snippet: t.Text || "",
            url: t.FirstURL || "",
          })) ?? [],
          source: "duckduckgo",
        });
      }

      // Brave Search API
      const res = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
        { headers: { "Accept": "application/json", "Accept-Encoding": "gzip", "X-Subscription-Token": searchApiKey } }
      );
      const data = await res.json();
      return JSON.stringify({
        results: data.web?.results?.slice(0, 5).map((r: any) => ({
          title: r.title,
          snippet: r.description,
          url: r.url,
        })) ?? [],
        source: "brave",
      });
    }
    case "deploy": {
      if (!machineId) return JSON.stringify({ error: "No machine available" });
      const result = await callAgent(machineId, "/deploy", "POST", input);
      return JSON.stringify(result);
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

// ---------------------------------------------------------------------------
// GET /conversations - list conversations
// ---------------------------------------------------------------------------
chat.get("/conversations", async (c) => {
  const userId = c.get("userId");
  const supabase = createServerClient();
  const limit = Number(c.req.query("limit")) || 50;
  const offset = Number(c.req.query("offset")) || 0;

  const { data, error, count } = await supabase
    .from("conversations")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return c.json({ error: { code: "FETCH_FAILED", message: error.message, status: 500 } }, 500);
  }

  return c.json({ conversations: data, total: count });
});

// ---------------------------------------------------------------------------
// POST /conversations - create conversation
// ---------------------------------------------------------------------------
chat.post("/conversations", zValidator("json", createConversationSchema), async (c) => {
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const supabase = createServerClient();

  const model = body.model ?? (await getActiveModel(supabase, userId));

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      title: body.title ?? null,
      model,
      system_prompt: body.system_prompt ?? null,
      is_pinned: false,
    })
    .select()
    .single();

  if (error) {
    return c.json({ error: { code: "CREATE_FAILED", message: error.message, status: 500 } }, 500);
  }

  return c.json({ conversation: data }, 201);
});

// ---------------------------------------------------------------------------
// GET /conversations/:id - get conversation with messages
// ---------------------------------------------------------------------------
chat.get("/conversations/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const supabase = createServerClient();

  const { data: conversation, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !conversation) {
    return c.json({ error: { code: "NOT_FOUND", message: "Conversation not found", status: 404 } }, 404);
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return c.json({ conversation, messages: messages ?? [] });
});

// ---------------------------------------------------------------------------
// DELETE /conversations/:id
// ---------------------------------------------------------------------------
chat.delete("/conversations/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const supabase = createServerClient();

  // Delete messages first, then conversation
  await supabase.from("messages").delete().eq("conversation_id", id);
  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return c.json({ error: { code: "DELETE_FAILED", message: error.message, status: 500 } }, 500);
  }

  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// PATCH /conversations/:id - rename, pin, etc.
// ---------------------------------------------------------------------------
chat.patch("/conversations/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const body = await c.req.json<{ title?: string; is_pinned?: boolean }>();
  const supabase = createServerClient();

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.is_pinned !== undefined) updates.is_pinned = body.is_pinned;

  const { data, error } = await supabase
    .from("conversations")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return c.json({ error: { code: "UPDATE_FAILED", message: error.message, status: 400 } }, 400);
  }

  return c.json({ conversation: data });
});

// ---------------------------------------------------------------------------
// POST /conversations/:id/message - send message with SSE streaming
// ---------------------------------------------------------------------------
chat.post("/conversations/:id/message", zValidator("json", sendMessageSchema), async (c) => {
  const userId = c.get("userId");
  const conversationId = c.req.param("id");
  const { content, model: requestedModel } = c.req.valid("json");
  const env = getEnv();
  const supabase = createServerClient();

  // 1. Verify conversation belongs to user
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .single();

  if (convError || !conversation) {
    return c.json({ error: { code: "NOT_FOUND", message: "Conversation not found", status: 404 } }, 404);
  }

  const model = (requestedModel ?? conversation.model) as AIModel;
  const modelConfig = MODEL_CONFIGS[model];

  // 2. Check credits (or BYOK)
  const userKey = await getUserApiKey(supabase, userId, modelConfig.provider);
  const isByok = !!userKey;

  if (!isByok) {
    const { data: creditsRemaining } = await supabase.rpc("get_credits_remaining", { p_user_id: userId });
    if ((creditsRemaining ?? 0) <= 0) {
      return c.json(
        { error: { code: "INSUFFICIENT_CREDITS", message: "No credits remaining. Add credits or use your own API key.", status: 402 } },
        402,
      );
    }
  }

  // Determine the API key to use
  const platformKey = (() => {
    switch (modelConfig.provider) {
      case "anthropic": return env.ANTHROPIC_API_KEY;
      case "openai": return env.OPENAI_API_KEY;
      case "google": return env.GOOGLE_AI_API_KEY;
    }
  })();

  const apiKey = userKey ?? platformKey;
  if (!apiKey) {
    return c.json(
      { error: { code: "NO_API_KEY", message: `No API key available for ${modelConfig.provider}`, status: 400 } },
      400,
    );
  }

  // 3. Fetch previous messages
  const { data: previousMessages } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(100);

  // 4. Fetch relevant memory for system prompt enrichment
  let memoryContext = "";
  try {
    if (env.OPENAI_API_KEY) {
      const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: "text-embedding-3-small", input: content }),
      });
      const embeddingData = (await embeddingRes.json()) as { data: Array<{ embedding: number[] }> };
      const queryEmbedding = embeddingData.data[0]?.embedding;

      if (queryEmbedding) {
        const { data: memories } = await supabase.rpc("search_memory", {
          p_user_id: userId,
          p_query_embedding: queryEmbedding,
          p_limit: 5,
          p_threshold: 0.7,
        });

        if (memories && memories.length > 0) {
          memoryContext = "\n\n<user_context>\nRelevant memories from the user's work history:\n" +
            memories.map((m: { summary?: string; content: string; source: string; captured_at: string }) =>
              `- [${m.source}] ${m.summary || m.content.slice(0, 200)}`
            ).join("\n") +
            "\n</user_context>";
        }
      }
    }
  } catch {
    // Memory enrichment is best-effort; don't block the response
  }

  // 5. Build system prompt
  const baseSystemPrompt = conversation.system_prompt ??
    "You are SHOGUN, the user's AI assistant with access to their cloud computer. You can execute commands, read/write files, search their memory, and deploy services. Be concise and helpful.";
  const systemPrompt = baseSystemPrompt + memoryContext;

  // 6. Get machine ID for tool execution (best effort)
  let machineId: string | null = null;
  try {
    const { data: machine } = await supabase
      .from("machines")
      .select("fly_machine_id")
      .eq("user_id", userId)
      .eq("status", "running")
      .single();
    machineId = machine?.fly_machine_id ?? null;
  } catch {
    // No machine — tool calls that need it will fail gracefully
  }

  // 7. Save user message
  await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "user",
    content,
    model: null,
    tool_calls: null,
    tool_results: null,
    token_input: null,
    token_output: null,
    cost_cents: null,
  });

  // 8. Stream the response
  const messages = [
    ...(previousMessages ?? []).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content },
  ];

  // Map tool definitions to provider format
  const tools = TOOL_DEFINITIONS.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema,
  }));

  return streamSSE(c, async (stream) => {
    let fullContent = "";
    const allToolCalls: ToolCall[] = [];
    const allToolResults: ToolResult[] = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    const aiClient = createAIClient({ provider: modelConfig.provider, apiKey });

    try {
      await aiClient.stream({
        model,
        messages,
        systemPrompt,
        tools,
        onEvent: async (event: StreamEvent) => {
          switch (event.type) {
            case "delta":
              fullContent += event.content;
              await stream.writeSSE({ data: JSON.stringify(event), event: "delta" });
              break;

            case "tool_call": {
              const toolCall: ToolCall = {
                id: `tc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                name: event.name,
                input: event.input,
              };
              allToolCalls.push(toolCall);
              await stream.writeSSE({ data: JSON.stringify(event), event: "tool_call" });

              // Execute the tool
              try {
                const output = await executeToolCall(userId, machineId, event.name, event.input, supabase);
                const toolResult: ToolResult = { toolCallId: toolCall.id, output };
                allToolResults.push(toolResult);
                await stream.writeSSE({
                  data: JSON.stringify({ type: "tool_result", name: event.name, output }),
                  event: "tool_result",
                });
              } catch (err) {
                console.error(`[chat] Tool execution failed: tool=${event.name} userId=${userId}`, err);
                const errorMsg = err instanceof Error ? err.message : "Tool execution failed";
                const toolResult: ToolResult = { toolCallId: toolCall.id, output: errorMsg, isError: true };
                allToolResults.push(toolResult);
                await stream.writeSSE({
                  data: JSON.stringify({ type: "tool_result", name: event.name, output: errorMsg, isError: true }),
                  event: "tool_result",
                });
              }
              break;
            }

            case "done": {
              totalInputTokens = event.usage.inputTokens;
              totalOutputTokens = event.usage.outputTokens;
              const costCents = isByok ? 0 : calculateCost(model, totalInputTokens, totalOutputTokens);
              const doneEvent = { ...event, usage: { ...event.usage, costCents } };
              await stream.writeSSE({ data: JSON.stringify(doneEvent), event: "done" });
              break;
            }

            case "error":
              await stream.writeSSE({ data: JSON.stringify(event), event: "error" });
              break;
          }
        },
      });

      // 9. Save assistant message
      const costCents = isByok ? 0 : calculateCost(model, totalInputTokens, totalOutputTokens);

      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: fullContent,
        model,
        tool_calls: allToolCalls.length > 0 ? allToolCalls : null,
        tool_results: allToolResults.length > 0 ? allToolResults : null,
        token_input: totalInputTokens,
        token_output: totalOutputTokens,
        cost_cents: costCents,
      });

      // 10. Deduct credits atomically if not BYOK
      if (!isByok && costCents > 0) {
        const { data: deducted, error: deductError } = await supabase.rpc("deduct_credits_atomic" as any, {
          p_user_id: userId,
          p_amount: costCents,
        });
        if (deductError || deducted === false) {
          // Message was already sent, so log the overdraft rather than blocking
          console.error(
            `[chat] Atomic credit deduction failed: userId=${userId} cost=${costCents} error=${deductError?.message ?? "insufficient balance"}`,
          );
        }
      }

      // Update conversation updated_at
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() } as any)
        .eq("id", conversationId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Streaming failed";
      await stream.writeSSE({ data: JSON.stringify({ type: "error", message }), event: "error" });
    }
  });
});

export default chat;
