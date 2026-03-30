import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createAutomationSchema } from "@shogun/shared";
import { createServerClient } from "@shogun/db";
import type { AuthVariables } from "../middleware/auth";
import { z } from "zod";

type AutomationVariables = AuthVariables & { machineId: string; flyAppName: string };

const automations = new Hono<{ Variables: AutomationVariables }>();

// ---------------------------------------------------------------------------
// Agent proxy helper
// ---------------------------------------------------------------------------

async function callAgent(machineId: string, path: string, method: string, body?: unknown): Promise<unknown> {
  const agentUrl = `http://${machineId}.vm.flycast:8080${path}`;
  const res = await fetch(agentUrl, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ---------------------------------------------------------------------------
// GET / - list automations
// ---------------------------------------------------------------------------
automations.get("/", async (c) => {
  const userId = c.get("userId");
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("automations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return c.json({ error: { code: "FETCH_FAILED", message: error.message, status: 500 } }, 500);
  }

  return c.json({ automations: data ?? [] });
});

// ---------------------------------------------------------------------------
// POST / - create automation
// ---------------------------------------------------------------------------
automations.post("/", zValidator("json", createAutomationSchema), async (c) => {
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("automations")
    .insert({
      user_id: userId,
      name: body.name,
      description: body.description ?? null,
      trigger_type: body.trigger_type,
      trigger_config: body.trigger_config,
      command: body.command,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    return c.json({ error: { code: "CREATE_FAILED", message: error.message, status: 500 } }, 500);
  }

  // Register the automation with the agent for scheduling
  const machineId = c.get("machineId");
  callAgent(machineId, "/automations/register", "POST", {
    automation_id: data.id,
    trigger_type: body.trigger_type,
    trigger_config: body.trigger_config,
    command: body.command,
  }).catch((err) => {
    console.error("Failed to register automation with agent:", err);
  });

  return c.json({ automation: data }, 201);
});

// ---------------------------------------------------------------------------
// GET /:id - get automation + recent runs
// ---------------------------------------------------------------------------
automations.get("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const supabase = createServerClient();

  const { data: automation, error } = await supabase
    .from("automations")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !automation) {
    return c.json({ error: { code: "NOT_FOUND", message: "Automation not found", status: 404 } }, 404);
  }

  const { data: runs } = await supabase
    .from("automation_runs")
    .select("*")
    .eq("automation_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  return c.json({ automation, runs: runs ?? [] });
});

// ---------------------------------------------------------------------------
// PATCH /:id - update automation
// ---------------------------------------------------------------------------
automations.patch(
  "/:id",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1).max(200).optional(),
      description: z.string().max(1000).optional(),
      trigger_config: z.record(z.unknown()).optional(),
      command: z.string().min(1).max(10000).optional(),
      status: z.enum(["active", "paused"]).optional(),
    }),
  ),
  async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("automations")
      .update(body)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      return c.json({ error: { code: "UPDATE_FAILED", message: error.message, status: 400 } }, 400);
    }

    return c.json({ automation: data });
  },
);

// ---------------------------------------------------------------------------
// DELETE /:id - delete automation
// ---------------------------------------------------------------------------
automations.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const supabase = createServerClient();

  // Delete runs first, then automation
  await supabase.from("automation_runs").delete().eq("automation_id", id);
  const { error } = await supabase
    .from("automations")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return c.json({ error: { code: "DELETE_FAILED", message: error.message, status: 500 } }, 500);
  }

  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// POST /:id/run - manual trigger
// ---------------------------------------------------------------------------
automations.post("/:id/run", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const machineId = c.get("machineId");
  const supabase = createServerClient();

  const { data: automation, error } = await supabase
    .from("automations")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !automation) {
    return c.json({ error: { code: "NOT_FOUND", message: "Automation not found", status: 404 } }, 404);
  }

  // Create a run record
  const { data: run, error: runError } = await supabase
    .from("automation_runs")
    .insert({
      automation_id: id,
      status: "running",
      triggered_by: "manual",
    })
    .select()
    .single();

  if (runError) {
    return c.json({ error: { code: "RUN_FAILED", message: runError.message, status: 500 } }, 500);
  }

  // Execute via agent (async)
  callAgent(machineId, "/automations/run", "POST", {
    run_id: run.id,
    automation_id: id,
    command: automation.command,
  }).then(async (result: any) => {
    await supabase
      .from("automation_runs")
      .update({
        status: "completed",
        output: result?.output ?? null,
        finished_at: new Date().toISOString(),
      })
      .eq("id", run.id);
  }).catch(async (err) => {
    await supabase
      .from("automation_runs")
      .update({
        status: "error",
        output: err instanceof Error ? err.message : "Execution failed",
        finished_at: new Date().toISOString(),
      })
      .eq("id", run.id);
  });

  return c.json({ run }, 202);
});

// ---------------------------------------------------------------------------
// GET /:id/logs - run logs
// ---------------------------------------------------------------------------
automations.get("/:id/logs", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const supabase = createServerClient();
  const limit = Math.min(Number(c.req.query("limit")) || 50, 100);
  const offset = Number(c.req.query("offset")) || 0;

  // Verify ownership
  const { data: automation } = await supabase
    .from("automations")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!automation) {
    return c.json({ error: { code: "NOT_FOUND", message: "Automation not found", status: 404 } }, 404);
  }

  const { data, error, count } = await supabase
    .from("automation_runs")
    .select("*", { count: "exact" })
    .eq("automation_id", id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return c.json({ error: { code: "FETCH_FAILED", message: error.message, status: 500 } }, 500);
  }

  return c.json({ logs: data ?? [], total: count });
});

export default automations;
