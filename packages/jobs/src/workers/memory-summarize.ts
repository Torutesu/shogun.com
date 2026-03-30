import { Worker, type Job } from "bullmq";
import { createServerClient } from "@shogun/db";
import { getRedisConnection } from "../connection";
import type { MemorySummarizeData } from "../queues";

/**
 * Worker: memory-summarize
 * Takes { entryId, content } and generates a 1-sentence summary via OpenAI,
 * then updates memory_entries.summary in Supabase.
 */
export function createMemorySummarizeWorker() {
  return new Worker<MemorySummarizeData>(
    "memory-summarize",
    async (job: Job<MemorySummarizeData>) => {
      const { entryId, content } = job.data;
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

      // Generate summary via OpenAI
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Summarize the following content in exactly 1 sentence. Be concise and capture the key point.",
            },
            { role: "user", content: content.slice(0, 4000) },
          ],
          max_tokens: 150,
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`);
      }

      const data = (await res.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const summary = data.choices[0]?.message.content ?? "";

      // Update Supabase
      const supabase = createServerClient();
      const { error } = await supabase
        .from("memory_entries")
        .update({ summary })
        .eq("id", entryId);

      if (error) throw error;

      return { entryId, summary };
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
    },
  );
}
