import { Worker, type Job } from "bullmq";
import { createServerClient } from "@shogun/db";
import { getRedisConnection } from "../connection";
import type { AutomationScheduleData } from "../queues";

/**
 * Minimal cron expression matcher.
 * Supports standard 5-field cron: minute hour day-of-month month day-of-week
 * Returns true if the given date matches the cron expression.
 */
function matchesCron(cron: string, date: Date): boolean {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  const fields = [
    date.getUTCMinutes(),
    date.getUTCHours(),
    date.getUTCDate(),
    date.getUTCMonth() + 1,
    date.getUTCDay(),
  ];

  return parts.every((part, i) => {
    if (part === "*") return true;

    // Handle */N step values
    if (part.startsWith("*/")) {
      const step = Number(part.slice(2));
      return step > 0 && fields[i]! % step === 0;
    }

    // Handle comma-separated values
    const values = part.split(",").map(Number);
    return values.includes(fields[i]!);
  });
}

/**
 * Worker: automation-schedule
 * Runs every minute. Queries active cron automations, checks if any should
 * fire based on trigger_config.cron, and dispatches execution to the container.
 */
export function createAutomationScheduleWorker() {
  return new Worker<AutomationScheduleData>(
    "automation-schedule",
    async (job: Job<AutomationScheduleData>) => {
      const supabase = createServerClient();
      const now = new Date(job.data.tick);

      // Fetch active cron automations
      const { data: automations, error } = await supabase
        .from("automations")
        .select("id, user_id, command, trigger_config")
        .eq("trigger_type", "cron")
        .eq("status", "active");

      if (error) throw error;
      if (!automations || automations.length === 0) return { fired: 0 };

      let fired = 0;

      for (const automation of automations) {
        const config = automation.trigger_config as { cron?: string };
        if (!config.cron) continue;

        if (!matchesCron(config.cron, now)) continue;

        // Fetch user's machine
        const { data: machine } = await supabase
          .from("machines")
          .select("id, fly_machine_id, status")
          .eq("user_id", automation.user_id)
          .eq("status", "running")
          .single();

        if (!machine) continue;

        // Record execution
        await supabase.from("automation_runs").insert({
          automation_id: automation.id,
          user_id: automation.user_id,
          status: "dispatched",
          started_at: now.toISOString(),
        });

        fired++;
      }

      return { fired };
    },
    {
      connection: getRedisConnection(),
      concurrency: 1,
    },
  );
}
