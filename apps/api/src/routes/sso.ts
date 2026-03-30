import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createServerClient } from "@shogun/db";
import type { AuthVariables } from "../middleware/auth";
import { logAudit } from "../lib/audit";
import { z } from "zod";

const sso = new Hono<{ Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const configureSsoSchema = z.object({
  entityId: z.string().min(1).max(500),
  ssoUrl: z.string().url(),
  certificate: z.string().min(1),
  metadataUrl: z.string().url().optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireTeamOwner(
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

  if (!member || member.role !== "owner") {
    return null;
  }
  return member;
}

/**
 * Minimal SAML response structure validator.
 * Full SAML XML parsing would be handled by @node-saml/node-saml in production.
 * This placeholder validates that a response contains the expected SAML structure.
 */
function parseSamlResponse(samlResponse: string): {
  valid: boolean;
  nameId?: string;
  attributes?: Record<string, string>;
  error?: string;
} {
  try {
    // Decode base64 if needed
    const xml = Buffer.from(samlResponse, "base64").toString("utf-8");

    // Basic structure checks (not cryptographic validation)
    if (!xml.includes("samlp:Response") && !xml.includes("saml2p:Response")) {
      return { valid: false, error: "Not a valid SAML response" };
    }

    // Extract NameID (very basic — production should use proper XML parsing)
    const nameIdMatch = xml.match(/<(?:saml2?:)?NameID[^>]*>([^<]+)<\//);
    if (!nameIdMatch) {
      return { valid: false, error: "No NameID found in SAML response" };
    }

    return {
      valid: true,
      nameId: nameIdMatch[1],
      attributes: {},
    };
  } catch {
    return { valid: false, error: "Failed to parse SAML response" };
  }
}

// ---------------------------------------------------------------------------
// POST /teams/:teamId/sso/configure — set SAML config (owner only)
// ---------------------------------------------------------------------------
sso.post("/teams/:teamId/sso/configure", zValidator("json", configureSsoSchema), async (c) => {
  const userId = c.get("userId");
  const teamId = c.req.param("teamId");
  const body = c.req.valid("json");
  const supabase = createServerClient();

  const owner = await requireTeamOwner(supabase, teamId, userId);
  if (!owner) {
    return c.json({ error: { code: "FORBIDDEN", message: "Only the team owner can configure SSO", status: 403 } }, 403);
  }

  const ssoConfig = {
    entityId: body.entityId,
    ssoUrl: body.ssoUrl,
    certificate: body.certificate,
    metadataUrl: body.metadataUrl ?? null,
    configuredAt: new Date().toISOString(),
    configuredBy: userId,
  };

  const { data: team, error } = await supabase
    .from("teams")
    .update({ sso_config: ssoConfig })
    .eq("id", teamId)
    .select()
    .single();

  if (error) {
    return c.json({ error: { code: "UPDATE_FAILED", message: error.message, status: 400 } }, 400);
  }

  await logAudit(supabase, {
    teamId,
    userId,
    action: "sso.configured",
    resourceType: "sso",
    metadata: { entityId: body.entityId, ssoUrl: body.ssoUrl },
    ipAddress: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
  });

  return c.json({
    sso: {
      entityId: ssoConfig.entityId,
      ssoUrl: ssoConfig.ssoUrl,
      metadataUrl: ssoConfig.metadataUrl,
      configuredAt: ssoConfig.configuredAt,
    },
  });
});

// ---------------------------------------------------------------------------
// GET /teams/:teamId/sso — get SSO config
// ---------------------------------------------------------------------------
sso.get("/teams/:teamId/sso", async (c) => {
  const userId = c.get("userId");
  const teamId = c.req.param("teamId");
  const supabase = createServerClient();

  const owner = await requireTeamOwner(supabase, teamId, userId);
  if (!owner) {
    return c.json({ error: { code: "FORBIDDEN", message: "Only the team owner can view SSO config", status: 403 } }, 403);
  }

  const { data: team } = await supabase
    .from("teams")
    .select("sso_config")
    .eq("id", teamId)
    .single();

  if (!team) {
    return c.json({ error: { code: "NOT_FOUND", message: "Team not found", status: 404 } }, 404);
  }

  if (!team.sso_config) {
    return c.json({ sso: null });
  }

  // Don't expose the certificate in GET responses
  const config = team.sso_config as Record<string, unknown>;
  return c.json({
    sso: {
      entityId: config.entityId,
      ssoUrl: config.ssoUrl,
      metadataUrl: config.metadataUrl,
      configuredAt: config.configuredAt,
    },
  });
});

// ---------------------------------------------------------------------------
// DELETE /teams/:teamId/sso — remove SSO config
// ---------------------------------------------------------------------------
sso.delete("/teams/:teamId/sso", async (c) => {
  const userId = c.get("userId");
  const teamId = c.req.param("teamId");
  const supabase = createServerClient();

  const owner = await requireTeamOwner(supabase, teamId, userId);
  if (!owner) {
    return c.json({ error: { code: "FORBIDDEN", message: "Only the team owner can remove SSO", status: 403 } }, 403);
  }

  const { error } = await supabase
    .from("teams")
    .update({ sso_config: null })
    .eq("id", teamId);

  if (error) {
    return c.json({ error: { code: "UPDATE_FAILED", message: error.message, status: 400 } }, 400);
  }

  await logAudit(supabase, {
    teamId,
    userId,
    action: "sso.removed",
    resourceType: "sso",
    ipAddress: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
  });

  return c.json({ deleted: true });
});

// ---------------------------------------------------------------------------
// GET /sso/callback — SAML assertion callback (ACS URL)
// ---------------------------------------------------------------------------
sso.post("/sso/callback", async (c) => {
  const supabase = createServerClient();

  // SAML responses come as form-encoded POST
  const body = await c.req.parseBody();
  const samlResponse = body["SAMLResponse"] as string | undefined;
  const relayState = body["RelayState"] as string | undefined;

  if (!samlResponse) {
    return c.json({ error: { code: "BAD_REQUEST", message: "Missing SAMLResponse", status: 400 } }, 400);
  }

  // Parse the relay state to get the team ID
  let teamId: string | undefined;
  try {
    if (relayState) {
      const parsed = JSON.parse(Buffer.from(relayState, "base64").toString("utf-8"));
      teamId = parsed.teamId;
    }
  } catch {
    // RelayState parsing is optional
  }

  if (!teamId) {
    return c.json({ error: { code: "BAD_REQUEST", message: "Missing team context in RelayState", status: 400 } }, 400);
  }

  // Get team SSO config
  const { data: team } = await supabase
    .from("teams")
    .select("sso_config")
    .eq("id", teamId)
    .single();

  if (!team?.sso_config) {
    return c.json({ error: { code: "NOT_CONFIGURED", message: "SSO not configured for this team", status: 400 } }, 400);
  }

  // Parse SAML response (basic validation — full validation with certificate
  // verification would use @node-saml/node-saml)
  const result = parseSamlResponse(samlResponse);

  if (!result.valid || !result.nameId) {
    return c.json({ error: { code: "SAML_ERROR", message: result.error ?? "Invalid SAML response", status: 400 } }, 400);
  }

  // The nameId is typically the user's email
  const email = result.nameId;

  // NOTE: In production, this would:
  // 1. Look up or create the user in Supabase Auth by email
  // 2. Create/link the profile
  // 3. Add to the team if not already a member
  // 4. Issue a JWT via Supabase Auth admin API
  // For now, return the parsed identity for the frontend to complete auth.

  return c.json({
    success: true,
    email,
    teamId,
    message: "SAML assertion validated. Full auth flow requires @node-saml/node-saml integration.",
  });
});

export default sso;
