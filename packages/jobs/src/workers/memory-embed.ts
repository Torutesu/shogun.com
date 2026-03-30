import { Worker, type Job } from "bullmq";
import { createServerClient } from "@shogun/db";
import { getRedisConnection } from "../connection";
import type { MemoryEmbedData } from "../queues";

/**
 * Worker: memory-embed
 * Takes { entryId, content } and generates an embedding via text-embedding-3-small,
 * then updates memory_entries.embedding in Supabase.
 */
export function createMemoryEmbedWorker() {
  return new Worker<MemoryEmbedData>(
    "memory-embed",
    async (job: Job<MemoryEmbedData>) => {
      const { entryId, content } = job.data;
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

      // Generate embedding via OpenAI
      const res = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: content.slice(0, 8000),
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`);
      }

      const data = (await res.json()) as {
        data: Array<{ embedding: number[] }>;
      };
      const embedding = data.data[0]?.embedding;
      if (!embedding) throw new Error("No embedding returned");

      // Update Supabase
      const supabase = createServerClient();
      const { error } = await supabase
        .from("memory_entries")
        .update({ embedding })
        .eq("id", entryId);

      if (error) throw error;

      return { entryId, dimensions: embedding.length };
    },
    {
      connection: getRedisConnection(),
      concurrency: 10,
    },
  );
}
