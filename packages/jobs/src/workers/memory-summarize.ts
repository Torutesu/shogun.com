import { Worker, type Job } from "bullmq";
import { getRedisConnection } from "../connection";
import { createServerClient } from "@shogun/db";

export interface MemorySummarizeJob {
  entryId: string;
  content: string;
}

async function generateSummary(content: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Summarize the following content in exactly 1 sentence. Be concise and specific." },
        { role: "user", content: content.slice(0, 4000) },
      ],
      max_tokens: 150,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);

  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message.content ?? "";
}

export function createMemorySummarizeWorker(): Worker<MemorySummarizeJob> {
  return new Worker<MemorySummarizeJob>(
    "memory-summarize",
    async (job: Job<MemorySummarizeJob>) => {
      const { entryId, content } = job.data;
      const summary = await generateSummary(content);

      const supabase = createServerClient();
      const { error } = await supabase
        .from("memory_entries")
        .update({ summary })
        .eq("id", entryId);

      if (error) throw new Error(`Supabase update failed: ${error.message}`);
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
    },
  );
}
