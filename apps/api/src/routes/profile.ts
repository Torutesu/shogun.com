import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { updateProfileSchema, handleSchema } from "@shogun/shared";
import { createServerClient } from "@shogun/db";
import type { AuthVariables } from "../middleware/auth";
import { z } from "zod";

const profile = new Hono<{ Variables: AuthVariables }>();

// GET / - get current user profile
profile.get("/", async (c) => {
  const userId = c.get("userId");
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return c.json({ error: { code: "NOT_FOUND", message: "Profile not found", status: 404 } }, 404);
  }

  return c.json({ profile: data });
});

// PATCH / - update profile
profile.patch("/", zValidator("json", updateProfileSchema), async (c) => {
  const userId = c.get("userId");
  const updates = c.req.valid("json");
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    return c.json({ error: { code: "UPDATE_FAILED", message: error.message, status: 400 } }, 400);
  }

  return c.json({ profile: data });
});

// GET /handle/:handle - check handle availability
profile.get("/handle/:handle", async (c) => {
  const handle = c.req.param("handle");

  const validation = handleSchema.safeParse(handle);
  if (!validation.success) {
    return c.json({ available: false, reason: validation.error.issues[0]?.message ?? "Invalid handle" });
  }

  const supabase = createServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .single();

  return c.json({ available: !data, handle });
});

// POST /handle - claim handle
profile.post("/handle", zValidator("json", z.object({ handle: handleSchema })), async (c) => {
  const userId = c.get("userId");
  const { handle } = c.req.valid("json");
  const supabase = createServerClient();

  // Check availability
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .single();

  if (existing) {
    return c.json({ error: { code: "HANDLE_TAKEN", message: "This handle is already taken", status: 409 } }, 409);
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ handle })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    return c.json({ error: { code: "UPDATE_FAILED", message: error.message, status: 400 } }, 400);
  }

  return c.json({ profile: data });
});

export default profile;
