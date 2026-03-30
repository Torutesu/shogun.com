import { Worker, type Job } from "bullmq";
import { createServerClient } from "@shogun/db";
import { getRedisConnection } from "../connection";

export interface WeeklyDigestData {
  userId: string;
  timezone: string;
}

/**
 * Worker: weekly-digest
 * Runs every Monday at 9:00 AM (user's timezone).
 * Fetches memory entries from the past 7 days, groups by app/source,
 * generates an AI summary, and stores it as a memory_entry.
 */
export function createWeeklyDigestWorker() {
  return new Worker<WeeklyDigestData>(
    "weekly-digest",
    async (job: Job<WeeklyDigestData>) => {
      const { userId } = job.data;
      const supabase = createServerClient();
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

      // Calculate date range (past 7 days)
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Fetch memory entries from the past week
      const { data: entries, error } = await supabase
        .from("memory_entries")
        .select("source, app_name, summary, content, captured_at")
        .eq("user_id", userId)
        .gte("captured_at", weekAgo.toISOString())
        .lte("captured_at", now.toISOString())
        .order("captured_at", { ascending: true });

      if (error) throw error;
      if (!entries || entries.length === 0) return { skipped: true };

      // Group by source/app
      const groups: Record<string, string[]> = {};
      for (const entry of entries) {
        const key = entry.app_name ?? entry.source;
        if (!groups[key]) groups[key] = [];
        const text = entry.summary ?? entry.content?.slice(0, 200) ?? "";
        if (text) groups[key].push(text);
      }

      // Build context for AI summary
      const contextLines: string[] = [];
      for (const [source, items] of Object.entries(groups)) {
        contextLines.push(`## ${source} (${items.length} entries)`);
        // Include up to 10 samples per group
        for (const item of items.slice(0, 10)) {
          contextLines.push(`- ${item}`);
        }
      }
      const context = contextLines.join("\n");

      // Generate AI summary
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
                "You are a personal productivity assistant. Generate a weekly digest summary for the user. " +
                "Start with \"This week you worked on...\" and provide a concise overview of their activities " +
                "grouped by app or source. Keep it under 300 words. Be specific about what was accomplished.",
            },
            {
              role: "user",
              content: `Here are my work memory entries from the past week:\n\n${context}`,
            },
          ],
          max_tokens: 500,
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`);
      }

      const data = (await res.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const digestContent = data.choices[0]?.message.content ?? "";

      if (!digestContent) return { skipped: true };

      // Store as a memory entry
      const { error: insertError } = await supabase.from("memory_entries").insert({
        user_id: userId,
        source: "manual",
        content: digestContent,
        summary: `Weekly digest: ${weekAgo.toISOString().slice(0, 10)} to ${now.toISOString().slice(0, 10)}`,
        app_name: "shogun-digest",
        captured_at: now.toISOString(),
        metadata: { type: "weekly_digest" },
      });

      if (insertError) throw insertError;

      return { userId, entriesProcessed: entries.length };
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
    },
  );
}
