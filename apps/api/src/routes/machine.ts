import { Hono } from "hono";
import { createServerClient } from "@shogun/db";
import { FlyMachineManager } from "@shogun/infra";
import { LOCALE_REGION_MAP } from "@shogun/shared";
import type { AuthVariables } from "../middleware/auth";
import { getEnv } from "../lib/env";

const machine = new Hono<{ Variables: AuthVariables }>();

function getFlyManager(): FlyMachineManager {
  const env = getEnv();
  return new FlyMachineManager(env.FLY_API_TOKEN, env.FLY_ORG);
}

// GET / - get user's machine status
machine.get("/", async (c) => {
  const userId = c.get("userId");
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("machines")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return c.json({ machine: null });
  }

  // Refresh status from Fly if we have the machine details
  if (data.fly_app_name && data.fly_machine_id && data.status !== "provisioning") {
    try {
      const fly = getFlyManager();
      const liveStatus = await fly.getStatus(data.fly_app_name, data.fly_machine_id);
      const mappedStatus = mapFlyStatus(liveStatus);

      if (mappedStatus !== data.status) {
        await supabase
          .from("machines")
          .update({ status: mappedStatus })
          .eq("id", data.id);
        data.status = mappedStatus;
      }
    } catch {
      // Use cached status on Fly API failure
    }
  }

  return c.json({ machine: data });
});

// POST /provision - start provisioning
machine.post("/provision", async (c) => {
  const userId = c.get("userId");
  const supabase = createServerClient();

  // Check for existing machine
  const { data: existing } = await supabase
    .from("machines")
    .select("id, status")
    .eq("user_id", userId)
    .single();

  if (existing && existing.status !== "error") {
    return c.json(
      { error: { code: "MACHINE_EXISTS", message: "You already have a machine. Delete it first to re-provision.", status: 409 } },
      409,
    );
  }

  // Get user profile for handle and locale
  const { data: profile } = await supabase
    .from("profiles")
    .select("handle, locale")
    .eq("id", userId)
    .single();

  if (!profile) {
    return c.json({ error: { code: "NO_PROFILE", message: "Profile not found", status: 404 } }, 404);
  }

  // Get subscription tier
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier")
    .eq("user_id", userId)
    .single();

  const tier = (subscription?.tier ?? "free") as "free" | "basic" | "pro" | "ultra";
  const region = LOCALE_REGION_MAP[profile.locale] ?? "iad";

  // Create DB record in provisioning state
  if (existing) {
    // Re-provision existing errored machine
    await supabase
      .from("machines")
      .update({ status: "provisioning", fly_machine_id: null, fly_app_name: null, ip_address: null })
      .eq("id", existing.id);
  } else {
    const { error: insertError } = await supabase.from("machines").insert({
      user_id: userId,
      region,
      status: "provisioning",
      cpu_cores: 1,
      memory_mb: 256,
      storage_gb: 100,
    });
    if (insertError) {
      return c.json({ error: { code: "PROVISION_FAILED", message: insertError.message, status: 500 } }, 500);
    }
  }

  // Kick off async provisioning
  const fly = getFlyManager();
  fly.provision({ userId, handle: profile.handle, tier, region })
    .then(async (info) => {
      await supabase
        .from("machines")
        .update({
          fly_machine_id: info.machineId,
          fly_app_name: info.appName,
          ip_address: info.ipAddress,
          status: "running",
        })
        .eq("user_id", userId);
    })
    .catch(async (err) => {
      console.error("Provisioning failed:", err);
      await supabase
        .from("machines")
        .update({ status: "error" })
        .eq("user_id", userId);
    });

  return c.json({ status: "provisioning", region }, 202);
});

// POST /start - wake sleeping machine
machine.post("/start", async (c) => {
  const userId = c.get("userId");
  const supabase = createServerClient();

  const { data: machineData, error } = await supabase
    .from("machines")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !machineData) {
    return c.json({ error: { code: "NO_MACHINE", message: "No machine found", status: 404 } }, 404);
  }

  if (machineData.status === "running") {
    return c.json({ status: "running" });
  }

  if (!machineData.fly_app_name || !machineData.fly_machine_id) {
    return c.json({ error: { code: "MACHINE_NOT_READY", message: "Machine not fully provisioned", status: 409 } }, 409);
  }

  const fly = getFlyManager();
  try {
    await fly.start(machineData.fly_app_name, machineData.fly_machine_id);
    await supabase
      .from("machines")
      .update({ status: "running", last_active_at: new Date().toISOString() })
      .eq("id", machineData.id);
    return c.json({ status: "running" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start machine";
    return c.json({ error: { code: "START_FAILED", message, status: 500 } }, 500);
  }
});

// POST /stop - stop machine
machine.post("/stop", async (c) => {
  const userId = c.get("userId");
  const supabase = createServerClient();

  const { data: machineData, error } = await supabase
    .from("machines")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !machineData) {
    return c.json({ error: { code: "NO_MACHINE", message: "No machine found", status: 404 } }, 404);
  }

  if (machineData.status === "stopped") {
    return c.json({ status: "stopped" });
  }

  if (!machineData.fly_app_name || !machineData.fly_machine_id) {
    return c.json({ error: { code: "MACHINE_NOT_READY", message: "Machine not fully provisioned", status: 409 } }, 409);
  }

  const fly = getFlyManager();
  try {
    await fly.stop(machineData.fly_app_name, machineData.fly_machine_id);
    await supabase
      .from("machines")
      .update({ status: "stopped" })
      .eq("id", machineData.id);
    return c.json({ status: "stopped" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to stop machine";
    return c.json({ error: { code: "STOP_FAILED", message, status: 500 } }, 500);
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapFlyStatus(flyState: string): "running" | "sleeping" | "stopped" | "error" {
  switch (flyState) {
    case "started":
    case "running":
      return "running";
    case "suspended":
      return "sleeping";
    case "stopped":
    case "destroyed":
      return "stopped";
    default:
      return "error";
  }
}

export default machine;
