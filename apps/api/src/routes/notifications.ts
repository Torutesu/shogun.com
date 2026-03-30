import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { addChannelSchema } from "@shogun/shared";
import { createServerClient } from "@shogun/db";
import type { AuthVariables } from "../middleware/auth";
import { randomBytes } from "node:crypto";

const notifications = new Hono<{ Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// Brute-force protection for verification attempts
// ---------------------------------------------------------------------------

interface VerifyAttempt {
  count: number;
  firstAttemptAt: number;
}

const verifyAttempts = new Map<string, VerifyAttempt>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of verifyAttempts) {
    if (now - entry.firstAttemptAt > 10 * 60 * 1000) {
      verifyAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000);

const MAX_VERIFY_ATTEMPTS = 5;
const VERIFY_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// ---------------------------------------------------------------------------
// GET /channels - list notification channels
// ---------------------------------------------------------------------------
notifications.get("/channels", async (c) => {
  const userId = c.get("userId");
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("notification_channels")
    .select("id, channel, identifier, verified, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return c.json({ error: { code: "FETCH_FAILED", message: error.message, status: 500 } }, 500);
  }

  return c.json({ channels: data ?? [] });
});

// ---------------------------------------------------------------------------
// POST /channels - add channel
// ---------------------------------------------------------------------------
notifications.post("/channels", zValidator("json", addChannelSchema), async (c) => {
  const userId = c.get("userId");
  const { channel, identifier } = c.req.valid("json");
  const supabase = createServerClient();

  // Generate verification code (8 hex chars for brute-force resistance)
  const verificationCode = randomBytes(4).toString("hex");

  const { data, error } = await supabase
    .from("notification_channels")
    .insert({
      user_id: userId,
      channel,
      identifier,
      verified: false,
      verification_code: verificationCode,
      verification_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    })
    .select("id, channel, identifier, verified, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return c.json(
        { error: { code: "DUPLICATE", message: "This channel and identifier combination already exists", status: 409 } },
        409,
      );
    }
    return c.json({ error: { code: "CREATE_FAILED", message: error.message, status: 500 } }, 500);
  }

  // Send verification code via the appropriate channel
  // TODO: integrate with actual SMS/email/LINE services
  // For now, the code is stored and can be retrieved for testing
  console.log(`[notifications] Verification code sent for ${channel}:${identifier}`);

  return c.json({ channel: data }, 201);
});

// ---------------------------------------------------------------------------
// DELETE /channels/:id - remove channel
// ---------------------------------------------------------------------------
notifications.delete("/channels/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const supabase = createServerClient();

  const { error } = await supabase
    .from("notification_channels")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return c.json({ error: { code: "DELETE_FAILED", message: error.message, status: 500 } }, 500);
  }

  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// POST /channels/:id/verify - send/verify verification code
// ---------------------------------------------------------------------------
notifications.post("/channels/:id/verify", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const supabase = createServerClient();

  let body: { code?: string };
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }

  if (!body.code) {
    return c.json({ error: { code: "MISSING_CODE", message: "Verification code is required", status: 400 } }, 400);
  }

  // Brute-force protection: max attempts per channel ID
  const attemptKey = `${userId}:${id}`;
  const attempt = verifyAttempts.get(attemptKey);
  const now = Date.now();
  if (attempt) {
    if (now - attempt.firstAttemptAt > VERIFY_WINDOW_MS) {
      // Window expired, reset
      verifyAttempts.delete(attemptKey);
    } else if (attempt.count >= MAX_VERIFY_ATTEMPTS) {
      return c.json(
        { error: { code: "TOO_MANY_ATTEMPTS", message: "Too many verification attempts. Try again later.", status: 429 } },
        429,
      );
    }
  }

  const { data: channel, error } = await supabase
    .from("notification_channels")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !channel) {
    return c.json({ error: { code: "NOT_FOUND", message: "Channel not found", status: 404 } }, 404);
  }

  if (channel.verified) {
    return c.json({ verified: true, message: "Already verified" });
  }

  // Check expiry
  if (channel.verification_expires_at && new Date(channel.verification_expires_at) < new Date()) {
    return c.json({ error: { code: "CODE_EXPIRED", message: "Verification code has expired. Request a new one.", status: 410 } }, 410);
  }

  // Track verification attempt
  const currentAttempt = verifyAttempts.get(attemptKey);
  if (currentAttempt) {
    currentAttempt.count++;
  } else {
    verifyAttempts.set(attemptKey, { count: 1, firstAttemptAt: Date.now() });
  }

  if (channel.verification_code !== body.code) {
    return c.json({ error: { code: "INVALID_CODE", message: "Incorrect verification code", status: 400 } }, 400);
  }

  // Clear attempts on success
  verifyAttempts.delete(attemptKey);

  await supabase
    .from("notification_channels")
    .update({ verified: true, verification_code: null, verification_expires_at: null })
    .eq("id", id);

  return c.json({ verified: true });
});

export default notifications;
