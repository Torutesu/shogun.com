import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { AIProvider, AIModel, StreamEvent } from "@shogun/shared";

export interface AIClient {
  stream(params: {
    model: AIModel;
    messages: Array<{ role: string; content: string }>;
    systemPrompt?: string;
    tools?: unknown[];
    onEvent: (event: StreamEvent) => void;
  }): Promise<void>;
}

interface ClientOptions {
  provider: AIProvider;
  apiKey: string;
}

export function createAIClient(options: ClientOptions): AIClient {
  switch (options.provider) {
    case "anthropic":
      return createAnthropicClient(options.apiKey);
    case "openai":
      return createOpenAIClient(options.apiKey);
    case "google":
      return createGeminiClient(options.apiKey);
  }
}

function createAnthropicClient(apiKey: string): AIClient {
  const client = new Anthropic({ apiKey });

  return {
    async stream({ model, messages, systemPrompt, tools, onEvent }) {
      const stream = client.messages.stream({
        model,
        max_tokens: 8192,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        tools: tools as Anthropic.Messages.Tool[],
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta") {
          const delta = event.delta;
          if ("text" in delta) {
            onEvent({ type: "delta", content: delta.text });
          }
        }
      }

      const finalMessage = await stream.finalMessage();
      const usage = finalMessage.usage;
      onEvent({
        type: "done",
        usage: {
          inputTokens: usage.input_tokens,
          outputTokens: usage.output_tokens,
          costCents: 0, // calculated by caller
        },
      });
    },
  };
}

function createOpenAIClient(apiKey: string): AIClient {
  const client = new OpenAI({ apiKey });

  return {
    async stream({ model, messages, systemPrompt, tools, onEvent }) {
      const allMessages = systemPrompt
        ? [{ role: "system" as const, content: systemPrompt }, ...messages]
        : messages;

      const stream = await client.chat.completions.create({
        model,
        messages: allMessages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
        tools: tools as OpenAI.ChatCompletionTool[],
        stream: true,
        stream_options: { include_usage: true },
      });

      let inputTokens = 0;
      let outputTokens = 0;

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          onEvent({ type: "delta", content: delta.content });
        }
        if (chunk.usage) {
          inputTokens = chunk.usage.prompt_tokens;
          outputTokens = chunk.usage.completion_tokens;
        }
      }

      onEvent({
        type: "done",
        usage: { inputTokens, outputTokens, costCents: 0 },
      });
    },
  };
}

function createGeminiClient(apiKey: string): AIClient {
  return {
    async stream({ model, messages, systemPrompt, tools, onEvent }) {
      // Map messages to Gemini format
      const contents = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      // Build request body
      const body: Record<string, unknown> = {
        contents,
        generationConfig: {
          maxOutputTokens: 8192,
        },
      };

      // Add system instruction if provided
      if (systemPrompt) {
        body.systemInstruction = { parts: [{ text: systemPrompt }] };
      }

      // Map tool definitions to Gemini function calling format
      if (tools && tools.length > 0) {
        const toolDefs = tools as Array<{
          name: string;
          description: string;
          inputSchema?: Record<string, unknown>;
          input_schema?: Record<string, unknown>;
        }>;
        body.tools = [
          {
            functionDeclarations: toolDefs.map((t) => ({
              name: t.name,
              description: t.description,
              parameters: t.inputSchema ?? t.input_schema ?? { type: "object", properties: {} },
            })),
          },
        ];
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        onEvent({ type: "error", message: `Gemini API error ${res.status}: ${errText}` });
        return;
      }

      if (!res.body) {
        onEvent({ type: "error", message: "No response body from Gemini" });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data) continue;

          try {
            const parsed = JSON.parse(data) as {
              candidates?: Array<{
                content?: {
                  parts?: Array<{
                    text?: string;
                    functionCall?: { name: string; args: Record<string, unknown> };
                  }>;
                };
              }>;
              usageMetadata?: {
                promptTokenCount?: number;
                candidatesTokenCount?: number;
              };
            };

            // Extract usage metadata
            if (parsed.usageMetadata) {
              totalInputTokens = parsed.usageMetadata.promptTokenCount ?? totalInputTokens;
              totalOutputTokens = parsed.usageMetadata.candidatesTokenCount ?? totalOutputTokens;
            }

            // Process content parts
            const parts = parsed.candidates?.[0]?.content?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.text) {
                  onEvent({ type: "delta", content: part.text });
                }
                if (part.functionCall) {
                  onEvent({
                    type: "tool_call",
                    name: part.functionCall.name,
                    input: part.functionCall.args,
                  });
                }
              }
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }

      onEvent({
        type: "done",
        usage: {
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          costCents: 0,
        },
      });
    },
  };
}
