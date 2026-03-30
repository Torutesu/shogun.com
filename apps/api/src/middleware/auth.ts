import { createMiddleware } from "hono/factory";
import { createClient } from "@supabase/supabase-js";
import { getEnv } from "../lib/env";

export type AuthVariables = {
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: ReturnType<typeof createClient<any>>;
};

/**
 * Supabase JWT verification middleware.
 * Extracts user_id from the JWT and sets it on context variables.
 */
export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Missing or invalid Authorization header", status: 401 } }, 401);
  }

  const token = authHeader.slice(7);
  const env = getEnv();

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Invalid or expired token", status: 401 } }, 401);
  }

  c.set("userId", user.id);
  c.set("supabase", supabase);
  await next();
});
