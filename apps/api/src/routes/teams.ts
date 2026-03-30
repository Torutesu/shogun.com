import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createTeamSchema, updateTeamSchema, inviteMemberSchema, updateMemberRoleSchema } from "@shogun/shared";
import { createServerClient } from "@shogun/db";
import type { AuthVariables } from "../middleware/auth";
import { logAudit } from "../lib/audit";
import { randomBytes } from "node:crypto";

const teams = new Hono<{ Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireTeamRole(
  supabase: ReturnType<typeof createServerClient>,
  teamId: string,
  userId: string,
  roles: string[],
) {
  const { data: member } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .single();

  if (!member || !roles.includes(member.role)) {
    return null;
  }
  return member;
}

// ---------------------------------------------------------------------------
// GET / — list user's teams
// ---------------------------------------------------------------------------
teams.get("/", async (c) => {
  const userId = c.get("userId");
  const supabase = createServerClient();

  const { data: memberships, error } = await supabase
    .from("team_members")
    .select("team_id, role, joined_at, teams(*)")
    .eq("user_id", userId);

  if (error) {
    return c.json({ error: { code: "FETCH_FAILED", message: error.message, status: 500 } }, 500);
  }

  const result = (memberships ?? []).map((m: any) => ({
    ...m.teams,
    role: m.role,
    joinedAt: m.joined_at,
  }));

  return c.json({ teams: result });
});

// ---------------------------------------------------------------------------
// POST / — create team
// ---------------------------------------------------------------------------
teams.post("/", zValidator("json", createTeamSchema), async (c) => {
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const supabase = createServerClient();

  // Create team
  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      name: body.name,
      slug: body.slug,
      owner_id: userId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return c.json({ error: { code: "SLUG_TAKEN", message: "This slug is already taken", status: 409 } }, 409);
    }
    return c.json({ error: { code: "CREATE_FAILED", message: error.message, status: 400 } }, 400);
  }

  // Add creator as owner member
  await supabase.from("team_members").insert({
    team_id: team.id,
    user_id: userId,
    role: "owner",
  });

  await logAudit(supabase, {
    teamId: team.id,
    userId,
    action: "team.created",
    resourceType: "team",
    resourceId: team.id,
    ipAddress: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
  });

  return c.json({ team }, 201);
});

// ---------------------------------------------------------------------------
// GET /:id — get team details + member count
// ---------------------------------------------------------------------------
teams.get("/:id", async (c) => {
  const userId = c.get("userId");
  const teamId = c.req.param("id");
  const supabase = createServerClient();

  const member = await requireTeamRole(supabase, teamId, userId, ["owner", "admin", "member", "viewer"]);
  if (!member) {
    return c.json({ error: { code: "FORBIDDEN", message: "Not a team member", status: 403 } }, 403);
  }

  const { data: team, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (error || !team) {
    return c.json({ error: { code: "NOT_FOUND", message: "Team not found", status: 404 } }, 404);
  }

  const { count } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId);

  return c.json({ team: { ...team, memberCount: count ?? 0 } });
});

// ---------------------------------------------------------------------------
// PATCH /:id — update team (owner/admin only)
// ---------------------------------------------------------------------------
teams.patch("/:id", zValidator("json", updateTeamSchema), async (c) => {
  const userId = c.get("userId");
  const teamId = c.req.param("id");
  const body = c.req.valid("json");
  const supabase = createServerClient();

  const member = await requireTeamRole(supabase, teamId, userId, ["owner", "admin"]);
  if (!member) {
    return c.json({ error: { code: "FORBIDDEN", message: "Owner or admin required", status: 403 } }, 403);
  }

  const { data: team, error } = await supabase
    .from("teams")
    .update(body)
    .eq("id", teamId)
    .select()
    .single();

  if (error) {
    return c.json({ error: { code: "UPDATE_FAILED", message: error.message, status: 400 } }, 400);
  }

  await logAudit(supabase, {
    teamId,
    userId,
    action: "team.updated",
    resourceType: "team",
    resourceId: teamId,
    metadata: body,
    ipAddress: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
  });

  return c.json({ team });
});

// ---------------------------------------------------------------------------
// DELETE /:id — delete team (owner only)
// ---------------------------------------------------------------------------
teams.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const teamId = c.req.param("id");
  const supabase = createServerClient();

  const member = await requireTeamRole(supabase, teamId, userId, ["owner"]);
  if (!member) {
    return c.json({ error: { code: "FORBIDDEN", message: "Only the owner can delete a team", status: 403 } }, 403);
  }

  await logAudit(supabase, {
    teamId,
    userId,
    action: "team.deleted",
    resourceType: "team",
    resourceId: teamId,
    ipAddress: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
  });

  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) {
    return c.json({ error: { code: "DELETE_FAILED", message: error.message, status: 400 } }, 400);
  }

  return c.json({ deleted: true });
});

// ---------------------------------------------------------------------------
// GET /:id/members — list members with profiles
// ---------------------------------------------------------------------------
teams.get("/:id/members", async (c) => {
  const userId = c.get("userId");
  const teamId = c.req.param("id");
  const supabase = createServerClient();

  const member = await requireTeamRole(supabase, teamId, userId, ["owner", "admin", "member", "viewer"]);
  if (!member) {
    return c.json({ error: { code: "FORBIDDEN", message: "Not a team member", status: 403 } }, 403);
  }

  const { data: members, error } = await supabase
    .from("team_members")
    .select("*, profiles(id, handle, display_name, avatar_url)")
    .eq("team_id", teamId)
    .order("joined_at", { ascending: true });

  if (error) {
    return c.json({ error: { code: "FETCH_FAILED", message: error.message, status: 500 } }, 500);
  }

  return c.json({ members: members ?? [] });
});

// ---------------------------------------------------------------------------
// POST /:id/members/invite — invite by email (admin+ only)
// ---------------------------------------------------------------------------
teams.post("/:id/members/invite", zValidator("json", inviteMemberSchema), async (c) => {
  const userId = c.get("userId");
  const teamId = c.req.param("id");
  const body = c.req.valid("json");
  const supabase = createServerClient();

  const member = await requireTeamRole(supabase, teamId, userId, ["owner", "admin"]);
  if (!member) {
    return c.json({ error: { code: "FORBIDDEN", message: "Admin or owner required", status: 403 } }, 403);
  }

  // Check member count limit
  const { data: team } = await supabase.from("teams").select("max_members").eq("id", teamId).single();
  const { count } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId);

  if (team && count !== null && count >= team.max_members) {
    return c.json({ error: { code: "LIMIT_REACHED", message: "Team member limit reached", status: 400 } }, 400);
  }

  const token = randomBytes(32).toString("hex");

  const { data: invite, error } = await supabase
    .from("team_invites")
    .insert({
      team_id: teamId,
      email: body.email,
      role: body.role,
      invited_by: userId,
      token,
    })
    .select()
    .single();

  if (error) {
    return c.json({ error: { code: "INVITE_FAILED", message: error.message, status: 400 } }, 400);
  }

  await logAudit(supabase, {
    teamId,
    userId,
    action: "member.invited",
    resourceType: "invite",
    resourceId: invite.id,
    metadata: { email: body.email, role: body.role },
    ipAddress: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
  });

  return c.json({ invite }, 201);
});

// ---------------------------------------------------------------------------
// DELETE /:id/members/:userId — remove member (admin+ only, can't remove owner)
// ---------------------------------------------------------------------------
teams.delete("/:id/members/:userId", async (c) => {
  const currentUserId = c.get("userId");
  const teamId = c.req.param("id");
  const targetUserId = c.req.param("userId");
  const supabase = createServerClient();

  const member = await requireTeamRole(supabase, teamId, currentUserId, ["owner", "admin"]);
  if (!member) {
    return c.json({ error: { code: "FORBIDDEN", message: "Admin or owner required", status: 403 } }, 403);
  }

  // Check the target's role — can't remove the owner
  const target = await requireTeamRole(supabase, teamId, targetUserId, ["owner", "admin", "member", "viewer"]);
  if (!target) {
    return c.json({ error: { code: "NOT_FOUND", message: "Member not found", status: 404 } }, 404);
  }
  if (target.role === "owner") {
    return c.json({ error: { code: "FORBIDDEN", message: "Cannot remove the team owner", status: 403 } }, 403);
  }

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", targetUserId);

  if (error) {
    return c.json({ error: { code: "DELETE_FAILED", message: error.message, status: 400 } }, 400);
  }

  await logAudit(supabase, {
    teamId,
    userId: currentUserId,
    action: "member.removed",
    resourceType: "member",
    resourceId: targetUserId,
    ipAddress: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
  });

  return c.json({ removed: true });
});

// ---------------------------------------------------------------------------
// PATCH /:id/members/:userId/role — change member role (owner only)
// ---------------------------------------------------------------------------
teams.patch("/:id/members/:userId/role", zValidator("json", updateMemberRoleSchema), async (c) => {
  const currentUserId = c.get("userId");
  const teamId = c.req.param("id");
  const targetUserId = c.req.param("userId");
  const body = c.req.valid("json");
  const supabase = createServerClient();

  const member = await requireTeamRole(supabase, teamId, currentUserId, ["owner"]);
  if (!member) {
    return c.json({ error: { code: "FORBIDDEN", message: "Only the owner can change roles", status: 403 } }, 403);
  }

  if (targetUserId === currentUserId) {
    return c.json({ error: { code: "FORBIDDEN", message: "Cannot change your own role", status: 403 } }, 403);
  }

  const { data: updated, error } = await supabase
    .from("team_members")
    .update({ role: body.role })
    .eq("team_id", teamId)
    .eq("user_id", targetUserId)
    .select()
    .single();

  if (error || !updated) {
    return c.json({ error: { code: "UPDATE_FAILED", message: error?.message ?? "Member not found", status: 400 } }, 400);
  }

  await logAudit(supabase, {
    teamId,
    userId: currentUserId,
    action: "member.role_changed",
    resourceType: "member",
    resourceId: targetUserId,
    metadata: { newRole: body.role },
    ipAddress: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
  });

  return c.json({ member: updated });
});

// ---------------------------------------------------------------------------
// POST /:id/leave — leave team (can't leave if owner)
// ---------------------------------------------------------------------------
teams.post("/:id/leave", async (c) => {
  const userId = c.get("userId");
  const teamId = c.req.param("id");
  const supabase = createServerClient();

  const member = await requireTeamRole(supabase, teamId, userId, ["owner", "admin", "member", "viewer"]);
  if (!member) {
    return c.json({ error: { code: "NOT_FOUND", message: "Not a team member", status: 404 } }, 404);
  }

  if (member.role === "owner") {
    return c.json({ error: { code: "FORBIDDEN", message: "Owner cannot leave. Transfer ownership or delete the team.", status: 403 } }, 403);
  }

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (error) {
    return c.json({ error: { code: "LEAVE_FAILED", message: error.message, status: 400 } }, 400);
  }

  return c.json({ left: true });
});

// ---------------------------------------------------------------------------
// GET /:id/invites — list pending invites
// ---------------------------------------------------------------------------
teams.get("/:id/invites", async (c) => {
  const userId = c.get("userId");
  const teamId = c.req.param("id");
  const supabase = createServerClient();

  const member = await requireTeamRole(supabase, teamId, userId, ["owner", "admin"]);
  if (!member) {
    return c.json({ error: { code: "FORBIDDEN", message: "Admin or owner required", status: 403 } }, 403);
  }

  const { data: invites, error } = await supabase
    .from("team_invites")
    .select("*")
    .eq("team_id", teamId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return c.json({ error: { code: "FETCH_FAILED", message: error.message, status: 500 } }, 500);
  }

  return c.json({ invites: invites ?? [] });
});

// ---------------------------------------------------------------------------
// DELETE /:id/invites/:inviteId — cancel invite
// ---------------------------------------------------------------------------
teams.delete("/:id/invites/:inviteId", async (c) => {
  const userId = c.get("userId");
  const teamId = c.req.param("id");
  const inviteId = c.req.param("inviteId");
  const supabase = createServerClient();

  const member = await requireTeamRole(supabase, teamId, userId, ["owner", "admin"]);
  if (!member) {
    return c.json({ error: { code: "FORBIDDEN", message: "Admin or owner required", status: 403 } }, 403);
  }

  const { error } = await supabase
    .from("team_invites")
    .delete()
    .eq("id", inviteId)
    .eq("team_id", teamId);

  if (error) {
    return c.json({ error: { code: "DELETE_FAILED", message: error.message, status: 400 } }, 400);
  }

  return c.json({ deleted: true });
});

// ---------------------------------------------------------------------------
// POST /invites/:token/accept — accept invite
// ---------------------------------------------------------------------------
teams.post("/invites/:token/accept", async (c) => {
  const userId = c.get("userId");
  const token = c.req.param("token");
  const supabase = createServerClient();

  const { data: invite, error: fetchErr } = await supabase
    .from("team_invites")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .single();

  if (fetchErr || !invite) {
    return c.json({ error: { code: "NOT_FOUND", message: "Invite not found or already used", status: 404 } }, 404);
  }

  // Check expiry
  if (new Date(invite.expires_at) < new Date()) {
    await supabase.from("team_invites").update({ status: "expired" }).eq("id", invite.id);
    return c.json({ error: { code: "EXPIRED", message: "This invite has expired", status: 410 } }, 410);
  }

  // Check member limit
  const { data: team } = await supabase.from("teams").select("max_members").eq("id", invite.team_id).single();
  const { count } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", invite.team_id);

  if (team && count !== null && count >= team.max_members) {
    return c.json({ error: { code: "LIMIT_REACHED", message: "Team member limit reached", status: 400 } }, 400);
  }

  // Add member
  const { error: insertErr } = await supabase.from("team_members").insert({
    team_id: invite.team_id,
    user_id: userId,
    role: invite.role,
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      // Already a member
      await supabase.from("team_invites").update({ status: "accepted" }).eq("id", invite.id);
      return c.json({ error: { code: "ALREADY_MEMBER", message: "You are already a member of this team", status: 409 } }, 409);
    }
    return c.json({ error: { code: "JOIN_FAILED", message: insertErr.message, status: 400 } }, 400);
  }

  // Mark invite as accepted
  await supabase.from("team_invites").update({ status: "accepted" }).eq("id", invite.id);

  await logAudit(supabase, {
    teamId: invite.team_id,
    userId,
    action: "member.joined",
    resourceType: "member",
    resourceId: userId,
    metadata: { via: "invite", inviteId: invite.id },
    ipAddress: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
  });

  return c.json({ joined: true, teamId: invite.team_id });
});

// ---------------------------------------------------------------------------
// POST /invites/:token/decline — decline invite
// ---------------------------------------------------------------------------
teams.post("/invites/:token/decline", async (c) => {
  const token = c.req.param("token");
  const supabase = createServerClient();

  const { data: invite } = await supabase
    .from("team_invites")
    .select("id")
    .eq("token", token)
    .eq("status", "pending")
    .single();

  if (!invite) {
    return c.json({ error: { code: "NOT_FOUND", message: "Invite not found or already used", status: 404 } }, 404);
  }

  await supabase.from("team_invites").update({ status: "declined" }).eq("id", invite.id);

  return c.json({ declined: true });
});

export default teams;
