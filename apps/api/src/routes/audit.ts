import { Hono } from "hono";
import { createServerClient } from "@shogun/db";
import type { AuthVariables } from "../middleware/auth";

const audit = new Hono<{ Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireTeamAdmin(
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

  if (!member || !["owner", "admin"].includes(member.role)) {
    return null;
  }
  return member;
}

// ---------------------------------------------------------------------------
// GET /:teamId/logs — paginated audit logs (admin+ only)
// Query params: ?page=1&limit=50&action=&user_id=&from=&to=
// ---------------------------------------------------------------------------
audit.get("/:teamId/logs", async (c) => {
  const userId = c.get("userId");
  const teamId = c.req.param("teamId");
  const supabase = createServerClient();

  const member = await requireTeamAdmin(supabase, teamId, userId);
  if (!member) {
    return c.json({ error: { code: "FORBIDDEN", message: "Admin or owner required", status: 403 } }, 403);
  }

  const page = Math.max(1, Number(c.req.query("page")) || 1);
  const limit = Math.min(Math.max(1, Number(c.req.query("limit")) || 50), 100);
  const offset = (page - 1) * limit;

  const action = c.req.query("action");
  const filterUserId = c.req.query("user_id");
  const from = c.req.query("from");
  const to = c.req.query("to");

  let query = supabase
    .from("audit_logs")
    .select("*, profiles:user_id(id, handle, display_name)", { count: "exact" })
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (action) {
    query = query.eq("action", action);
  }
  if (filterUserId) {
    query = query.eq("user_id", filterUserId);
  }
  if (from) {
    query = query.gte("created_at", from);
  }
  if (to) {
    query = query.lte("created_at", to);
  }

  const { data, error, count } = await query;

  if (error) {
    return c.json({ error: { code: "FETCH_FAILED", message: error.message, status: 500 } }, 500);
  }

  return c.json({
    logs: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
});

export default audit;
