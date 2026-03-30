import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createClient } from "@supabase/supabase-js";
import { signupSchema, loginSchema } from "@shogun/shared";
import { createServerClient } from "@shogun/db";
import { getEnv } from "../lib/env";

const auth = new Hono();

// POST /signup
auth.post("/signup", zValidator("json", signupSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const env = getEnv();

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return c.json({ error: { code: "SIGNUP_FAILED", message: error.message, status: 400 } }, 400);
  }

  const userId = data.user?.id;
  if (!userId) {
    return c.json({ error: { code: "SIGNUP_FAILED", message: "User creation failed", status: 500 } }, 500);
  }

  // Create profile, subscription, and credit balance with service role client
  const admin = createServerClient();

  const [profileResult, subscriptionResult] = await Promise.all([
    admin.from("profiles").insert({
      id: userId,
      handle: `user-${userId.slice(0, 8)}`,
      locale: "en",
      timezone: "UTC",
    }),
    admin.from("subscriptions").insert({
      user_id: userId,
      tier: "free",
      ai_credits_balance: 0,
      ai_credits_included: 0,
      cancel_at_period_end: false,
    }),
  ]);

  if (profileResult.error) {
    console.error("Failed to create profile:", profileResult.error);
  }
  if (subscriptionResult.error) {
    console.error("Failed to create subscription:", subscriptionResult.error);
  }

  return c.json({
    user: data.user,
    session: data.session,
  }, 201);
});

// POST /login
auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const env = getEnv();

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return c.json({ error: { code: "LOGIN_FAILED", message: error.message, status: 401 } }, 401);
  }

  return c.json({
    user: data.user,
    session: data.session,
  });
});

// POST /oauth/google
auth.post("/oauth/google", async (c) => {
  const env = getEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${env.APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return c.json({ error: { code: "OAUTH_FAILED", message: error.message, status: 400 } }, 400);
  }

  return c.json({ url: data.url });
});

// POST /refresh
auth.post("/refresh", async (c) => {
  const env = getEnv();
  const body = await c.req.json<{ refresh_token: string }>();

  if (!body.refresh_token) {
    return c.json({ error: { code: "MISSING_TOKEN", message: "refresh_token is required", status: 400 } }, 400);
  }

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: body.refresh_token });

  if (error) {
    return c.json({ error: { code: "REFRESH_FAILED", message: error.message, status: 401 } }, 401);
  }

  return c.json({ session: data.session });
});

// POST /logout
auth.post("/logout", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ success: true });
  }

  const token = authHeader.slice(7);
  const env = getEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  await supabase.auth.signOut();
  return c.json({ success: true });
});

export default auth;
