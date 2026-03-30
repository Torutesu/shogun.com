import { Worker, type Job } from "bullmq";
import { getRedisConnection } from "../connection";
import { createServerClient } from "@shogun/db";

export interface WeeklyDigestJob {
  userId: string;
  timezone: string;
}

async function generateDigestSummary(entriesBySource: Record<string, number>, topContent: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing AI API key for digest generation");

  const sourceSummary = Object.entries(entriesBySource)
    .map(([source, count]) => `${source}: ${count} entries`)
    .join(", ");

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
            "You are a productivity assistant. Generate a concise weekly digest summary starting with 'This week you worked on...' " +
            "Highlight key themes, projects, and accomplishments. Keep it under 300 words.",
        },
        {
          role: "user",
          content: `Sources breakdown: ${sourceSummary}\n\nSample content from the week:\n${topContent}`,
        },
      ],
      max_tokens: 500,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);

  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message.content ?? "This week you worked on various tasks.";
}

export function createWeeklyDigestWorker(): Worker<WeeklyDigestJob> {
  return new Worker<WeeklyDigestJob>(
    "weekly-digest",
    async (job: Job<WeeklyDigestJob>) => {
      const { userId } = job.data;
      const supabase = createServerClient();

      // Fetch memory entries from the past 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: entries, error } = await supabase
        .from("memory_entries")
        .select("id, source, content, summary, app_name, captured_at")
        .eq("user_id", userId)
        .gte("captured_at", sevenDaysAgo.toISOString())
        .order("captured_at", { ascending: false });

      if (error) throw new Error(`Failed to fetch entries: ${error.message}`);
      if (!entries || entries.length === 0) return; // Nothing to digest

      // Group by source
      const bySource: Record<string, number> = {};
      for (const entry of entries) {
        const src = entry.source ?? "unknown";
        bySource[src] = (bySource[src] ?? 0) + 1;
      }

      // Collect top content for summary (use summaries when available, fall back to content)
      const topContent = entries
        .slice(0, 30)
        .map((e) => e.summary ?? e.content?.slice(0, 200) ?? "")
        .filter(Boolean)
        .join("\n---\n");

      // Generate AI summary
      const digestContent = await generateDigestSummary(bySource, topContent);

      // Store as a memory entry
      await supabase.from("memory_entries").insert({
        user_id: userId,
        source: "manual",
        content: digestContent,
        summary: `Weekly digest: ${Object.keys(bySource).join(", ")} — ${entries.length} entries`,
        app_name: "shogun-digest",
        captured_at: new Date().toISOString(),
        metadata: { type: "weekly_digest", period_start: sevenDaysAgo.toISOString(), entry_count: entries.length, sources: bySource },
      });
    },
    {
      connection: getRedisConnection(),
      concurrency: 3,
    },
  );
}
