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

function createGeminiClient(_apiKey: string): AIClient {
  // Gemini integration — placeholder for Phase 1
  // Will use @google/generative-ai SDK
  return {
    async stream({ onEvent }) {
      onEvent({
        type: "error",
        message: "Gemini integration coming soon",
      });
    },
  };
}
