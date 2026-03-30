import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createServiceSchema, TIER_CONFIGS, type SubscriptionTier } from "@shogun/shared";
import { createServerClient } from "@shogun/db";
import type { AuthVariables } from "../middleware/auth";
import { z } from "zod";

type ServiceVariables = AuthVariables & { machineId: string; flyAppName: string };

const services = new Hono<{ Variables: ServiceVariables }>();

// ---------------------------------------------------------------------------
// GET / - list services
// ---------------------------------------------------------------------------
services.get("/", async (c) => {
  const userId = c.get("userId");
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return c.json({ error: { code: "FETCH_FAILED", message: error.message, status: 500 } }, 500);
  }

  return c.json({ services: data ?? [] });
});

// ---------------------------------------------------------------------------
// POST / - create service
// ---------------------------------------------------------------------------
services.post("/", zValidator("json", createServiceSchema), async (c) => {
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const supabase = createServerClient();

  // Check service limit
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier")
    .eq("user_id", userId)
    .single();

  const tier = (subscription?.tier ?? "free") as SubscriptionTier;
  const tierConfig = TIER_CONFIGS[tier];

  const { count } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) >= tierConfig.maxServices) {
    return c.json(
      { error: { code: "LIMIT_REACHED", message: `Your plan allows up to ${tierConfig.maxServices} services`, status: 403 } },
      403,
    );
  }

  // Check custom domain availability
  if (body.custom_domain && !tierConfig.customDomain) {
    return c.json(
      { error: { code: "UPGRADE_REQUIRED", message: "Custom domains require a paid plan", status: 403 } },
      403,
    );
  }

  const subdomain = body.subdomain ?? body.name;

  const { data, error } = await supabase
    .from("services")
    .insert({
      user_id: userId,
      name: body.name,
      port: body.port,
      subdomain,
      custom_domain: body.custom_domain ?? null,
      status: "deploying",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return c.json({ error: { code: "DUPLICATE", message: "Service name or subdomain already taken", status: 409 } }, 409);
    }
    return c.json({ error: { code: "CREATE_FAILED", message: error.message, status: 500 } }, 500);
  }

  // Kick off deployment via agent
  const machineId = c.get("machineId");
  callAgent(machineId, "/services/deploy", "POST", {
    service_id: data.id,
    name: body.name,
    port: body.port,
    subdomain,
  }).catch((err) => {
    console.error("Service deployment failed:", err);
    supabase.from("services").update({ status: "error" }).eq("id", data.id);
  });

  return c.json({ service: data }, 201);
});

// ---------------------------------------------------------------------------
// GET /:id - get service details
// ---------------------------------------------------------------------------
services.get("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return c.json({ error: { code: "NOT_FOUND", message: "Service not found", status: 404 } }, 404);
  }

  return c.json({ service: data });
});

// ---------------------------------------------------------------------------
// PATCH /:id - update service
// ---------------------------------------------------------------------------
services.patch(
  "/:id",
  zValidator(
    "json",
    z.object({
      port: z.number().int().min(1).max(65535).optional(),
      custom_domain: z.string().max(253).nullable().optional(),
    }),
  ),
  async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("services")
      .update(body)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      return c.json({ error: { code: "UPDATE_FAILED", message: error.message, status: 400 } }, 400);
    }

    return c.json({ service: data });
  },
);

// ---------------------------------------------------------------------------
// DELETE /:id - delete service
// ---------------------------------------------------------------------------
services.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const supabase = createServerClient();

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return c.json({ error: { code: "DELETE_FAILED", message: error.message, status: 500 } }, 500);
  }

  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// POST /:id/restart - restart service
// ---------------------------------------------------------------------------
services.post("/:id/restart", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const supabase = createServerClient();
  const machineId = c.get("machineId");

  const { data: service, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !service) {
    return c.json({ error: { code: "NOT_FOUND", message: "Service not found", status: 404 } }, 404);
  }

  try {
    await callAgent(machineId, `/services/${id}/restart`, "POST");
    await supabase.from("services").update({ status: "running" }).eq("id", id);
    return c.json({ status: "running" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Restart failed";
    return c.json({ error: { code: "RESTART_FAILED", message, status: 500 } }, 500);
  }
});

// ---------------------------------------------------------------------------
// Agent proxy helper
// ---------------------------------------------------------------------------

async function callAgent(machineId: string, path: string, method: string, body?: unknown): Promise<unknown> {
  const agentUrl = `http://${machineId}.vm.flycast:9000${path}`;
  const res = await fetch(agentUrl, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export default services;
