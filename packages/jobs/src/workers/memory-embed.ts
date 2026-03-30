import { Worker, type Job } from "bullmq";
import { getRedisConnection } from "../connection";
import { createServerClient } from "@shogun/db";

export interface MemoryEmbedJob {
  entryId: string;
  content: string;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
    }),
  });

  if (!res.ok) throw new Error(`OpenAI Embeddings API error: ${res.status}`);

  const data = (await res.json()) as { data: Array<{ embedding: number[] }> };
  return data.data[0]?.embedding ?? [];
}

export function createMemoryEmbedWorker(): Worker<MemoryEmbedJob> {
  return new Worker<MemoryEmbedJob>(
    "memory-embed",
    async (job: Job<MemoryEmbedJob>) => {
      const { entryId, content } = job.data;
      const embedding = await generateEmbedding(content);

      const supabase = createServerClient();
      const { error } = await supabase
        .from("memory_entries")
        .update({ embedding })
        .eq("id", entryId);

      if (error) throw new Error(`Supabase update failed: ${error.message}`);
    },
    {
      connection: getRedisConnection(),
      concurrency: 10,
    },
  );
}
