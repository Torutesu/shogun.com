import { Worker, type Job } from "bullmq";
import { getRedisConnection } from "../connection";
import { createServerClient } from "@shogun/db";

export interface AutomationScheduleJob {
  // Runs on a repeatable schedule — no per-job data needed
}

/**
 * Simple cron expression matcher for minute-level checks.
 * Supports standard 5-field cron: minute hour day-of-month month day-of-week
 */
function cronMatches(cronExpr: string, date: Date): boolean {
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length < 5) return false;

  const fields = [
    { value: date.getMinutes(), expr: parts[0] },
    { value: date.getHours(), expr: parts[1] },
    { value: date.getDate(), expr: parts[2] },
    { value: date.getMonth() + 1, expr: parts[3] },
    { value: date.getDay(), expr: parts[4] },
  ];

  return fields.every(({ value, expr }) => {
    if (!expr) return false;
    if (expr === "*") return true;

    // Handle */N step values
    if (expr.startsWith("*/")) {
      const step = parseInt(expr.slice(2), 10);
      return !isNaN(step) && step > 0 && value % step === 0;
    }

    // Handle comma-separated values
    const values = expr.split(",").map((v) => parseInt(v, 10));
    return values.includes(value);
  });
}

export function createAutomationScheduleWorker(): Worker<AutomationScheduleJob> {
  return new Worker<AutomationScheduleJob>(
    "automation-schedule",
    async (_job: Job<AutomationScheduleJob>) => {
      const supabase = createServerClient();
      const now = new Date();

      // Fetch all active cron automations
      const { data: automations, error } = await supabase
        .from("automations")
        .select("id, user_id, trigger_config, command")
        .eq("trigger_type", "cron")
        .eq("status", "active");

      if (error) throw new Error(`Failed to fetch automations: ${error.message}`);
      if (!automations || automations.length === 0) return;

      for (const automation of automations) {
        const config = automation.trigger_config as { cron?: string } | null;
        const cronExpr = config?.cron;
        if (!cronExpr || !cronMatches(cronExpr, now)) continue;

        // Dispatch execution: update last_run_at and send command to the user's machine
        // In production, this would call the Fly.io machine exec API via @shogun/infra
        await supabase
          .from("automations")
          .update({ last_run_at: now.toISOString() })
          .eq("id", automation.id);

        // Enqueue a machine exec command for the user's container
        // This is a lightweight dispatch — the actual execution happens on the Fly machine
        await supabase.from("automation_runs").insert({
          automation_id: automation.id,
          user_id: automation.user_id,
          command: automation.command,
          status: "pending",
          triggered_at: now.toISOString(),
        });
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 1,
    },
  );
}
