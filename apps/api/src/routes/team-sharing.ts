import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createServerClient } from "@shogun/db";
import type { AuthVariables } from "../middleware/auth";
import { logAudit } from "../lib/audit";
import { z } from "zod";

const teamSharing = new Hono<{ Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireTeamMember(
  supabase: ReturnType<typeof createServerClient>,
  teamId: string,
  userId: string,
) {
  const { data: member } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .single();

  return member;
}

const shareConversationSchema = z.object({
  conversation_id: z.string().uuid(),
});

const shareMemorySchema = z.object({
  memory_entry_id: z.string().uuid(),
});

const searchSharedMemorySchema = z.object({
  query: z.string().min(1).max(1000).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

// ---------------------------------------------------------------------------
// POST /:teamId/conversations — share a conversation with team
// ---------------------------------------------------------------------------
teamSharing.post("/:teamId/conversations", zValidator("json", shareConversationSchema), async (c) => {
  const userId = c.get("userId");
  const teamId = c.req.param("teamId");
  const body = c.req.valid("json");
  const supabase = createServerClient();

  const member = await requireTeamMember(supabase, teamId, userId);
  if (!member) {
    return c.json({ error: { code: "FORBIDDEN", message: "Not a team member", status: 403 } }, 403);
  }

  // Verify user owns the conversation
  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", body.conversation_id)
    .eq("user_id", userId)
    .single();

  if (!conv) {
    return c.json({ error: { code: "NOT_FOUND", message: "Conversation not found or not owned by you", status: 404 } }, 404);
  }

  const { data: shared, error } = await supabase
    .from("shared_conversations")
    .insert({
      conversation_id: body.conversation_id,
      team_id: teamId,
      shared_by: userId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return c.json({ error: { code: "ALREADY_SHARED", message: "Conversation already shared with this team", status: 409 } }, 409);
    }
    return c.json({ error: { code: "SHARE_FAILED", message: error.message, status: 400 } }, 400);
  }

  await logAudit(supabase, {
    teamId,
    userId,
    action: "conversation.shared",
    resourceType: "conversation",
    resourceId: body.conversation_id,
    ipAddress: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
  });

  return c.json({ shared }, 201);
});

// ---------------------------------------------------------------------------
// GET /:teamId/conversations — list shared conversations
// ---------------------------------------------------------------------------
teamSharing.get("/:teamId/conversations", async (c) => {
  const userId = c.get("userId");
  const teamId = c.req.param("teamId");
  const supabase = createServerClient();

  const member = await requireTeamMember(supabase, teamId, userId);
  if (!member) {
    return c.json({ error: { code: "FORBIDDEN", message: "Not a team member", status: 403 } }, 403);
  }

  const { data, error } = await supabase
    .from("shared_conversations")
    .select("*, conversations(id, title, model, created_at, updated_at), profiles:shared_by(id, handle, display_name)")
    .eq("team_id", teamId)
    .order("shared_at", { ascending: false });

  if (error) {
    return c.json({ error: { code: "FETCH_FAILED", message: error.message, status: 500 } }, 500);
  }

  return c.json({ conversations: data ?? [] });
});

// ---------------------------------------------------------------------------
// DELETE /:teamId/conversations/:id — unshare
// ---------------------------------------------------------------------------
teamSharing.delete("/:teamId/conversations/:id", async (c) => {
  const userId = c.get("userId");
  const teamId = c.req.param("teamId");
  const shareId = c.req.param("id");
  const supabase = createServerClient();

  const member = await requireTeamMember(supabase, teamId, userId);
  if (!member) {
    return c.json({ error: { code: "FORBIDDEN", message: "Not a team member", status: 403 } }, 403);
  }

  // Only the sharer or an admin/owner can unshare
  const { data: shared } = await supabase
    .from("shared_conversations")
    .select("shared_by")
    .eq("id", shareId)
    .eq("team_id", teamId)
    .single();

  if (!shared) {
    return c.json({ error: { code: "NOT_FOUND", message: "Shared conversation not found", status: 404 } }, 404);
  }

  if (shared.shared_by !== userId && !["owner", "admin"].includes(member.role)) {
    return c.json({ error: { code: "FORBIDDEN", message: "Only the sharer or admins can unshare", status: 403 } }, 403);
  }

  const { error } = await supabase
    .from("shared_conversations")
    .delete()
    .eq("id", shareId);

  if (error) {
    return c.json({ error: { code: "DELETE_FAILED", message: error.message, status: 400 } }, 400);
  }

  return c.json({ deleted: true });
});

// ---------------------------------------------------------------------------
// POST /:teamId/memory — share memory entries with team
// ---------------------------------------------------------------------------
teamSharing.post("/:teamId/memory", zValidator("json", shareMemorySchema), async (c) => {
  const userId = c.get("userId");
  const teamId = c.req.param("teamId");
  const body = c.req.valid("json");
  const supabase = createServerClient();

  const member = await requireTeamMember(supabase, teamId, userId);
  if (!member) {
    return c.json({ error: { code: "FORBIDDEN", message: "Not a team member", status: 403 } }, 403);
  }

  // Verify user owns the memory entry
  const { data: entry } = await supabase
    .from("memory_entries")
    .select("id")
    .eq("id", body.memory_entry_id)
    .eq("user_id", userId)
    .single();

  if (!entry) {
    return c.json({ error: { code: "NOT_FOUND", message: "Memory entry not found or not owned by you", status: 404 } }, 404);
  }

  const { data: shared, error } = await supabase
    .from("shared_memory")
    .insert({
      memory_entry_id: body.memory_entry_id,
      team_id: teamId,
      shared_by: userId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return c.json({ error: { code: "ALREADY_SHARED", message: "Memory already shared with this team", status: 409 } }, 409);
    }
    return c.json({ error: { code: "SHARE_FAILED", message: error.message, status: 400 } }, 400);
  }

  await logAudit(supabase, {
    teamId,
    userId,
    action: "memory.shared",
    resourceType: "memory",
    resourceId: body.memory_entry_id,
    ipAddress: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
  });

  return c.json({ shared }, 201);
});

// ---------------------------------------------------------------------------
// GET /:teamId/memory — list shared memory (with optional search)
// ---------------------------------------------------------------------------
teamSharing.get("/:teamId/memory", async (c) => {
  const userId = c.get("userId");
  const teamId = c.req.param("teamId");
  const query = c.req.query("query");
  const limit = Math.min(Number(c.req.query("limit")) || 50, 100);
  const supabase = createServerClient();

  const member = await requireTeamMember(supabase, teamId, userId);
  if (!member) {
    return c.json({ error: { code: "FORBIDDEN", message: "Not a team member", status: 403 } }, 403);
  }

  // If a search query is provided, filter by content similarity (text match for now)
  let queryBuilder = supabase
    .from("shared_memory")
    .select("*, memory_entries(id, content, summary, source, app_name, captured_at), profiles:shared_by(id, handle, display_name)")
    .eq("team_id", teamId)
    .order("shared_at", { ascending: false })
    .limit(limit);

  const { data, error } = await queryBuilder;

  if (error) {
    return c.json({ error: { code: "FETCH_FAILED", message: error.message, status: 500 } }, 500);
  }

  let results = data ?? [];

  // Client-side text filter if query is provided (semantic search would require embedding)
  if (query) {
    const lowerQuery = query.toLowerCase();
    results = results.filter((r: any) => {
      const entry = r.memory_entries;
      if (!entry) return false;
      return (
        entry.content?.toLowerCase().includes(lowerQuery) ||
        entry.summary?.toLowerCase().includes(lowerQuery)
      );
    });
  }

  return c.json({ memory: results });
});

// ---------------------------------------------------------------------------
// DELETE /:teamId/memory/:id — unshare
// ---------------------------------------------------------------------------
teamSharing.delete("/:teamId/memory/:id", async (c) => {
  const userId = c.get("userId");
  const teamId = c.req.param("teamId");
  const shareId = c.req.param("id");
  const supabase = createServerClient();

  const member = await requireTeamMember(supabase, teamId, userId);
  if (!member) {
    return c.json({ error: { code: "FORBIDDEN", message: "Not a team member", status: 403 } }, 403);
  }

  const { data: shared } = await supabase
    .from("shared_memory")
    .select("shared_by")
    .eq("id", shareId)
    .eq("team_id", teamId)
    .single();

  if (!shared) {
    return c.json({ error: { code: "NOT_FOUND", message: "Shared memory not found", status: 404 } }, 404);
  }

  if (shared.shared_by !== userId && !["owner", "admin"].includes(member.role)) {
    return c.json({ error: { code: "FORBIDDEN", message: "Only the sharer or admins can unshare", status: 403 } }, 403);
  }

  const { error } = await supabase
    .from("shared_memory")
    .delete()
    .eq("id", shareId);

  if (error) {
    return c.json({ error: { code: "DELETE_FAILED", message: error.message, status: 400 } }, 400);
  }

  return c.json({ deleted: true });
});

export default teamSharing;
