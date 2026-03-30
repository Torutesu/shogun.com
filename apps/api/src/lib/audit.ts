import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuditParams {
  teamId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Create an audit log entry for a team action.
 */
export async function logAudit(
  supabase: SupabaseClient,
  params: AuditParams,
): Promise<void> {
  const { teamId, userId, action, resourceType, resourceId, metadata, ipAddress } = params;

  await supabase.from("audit_logs").insert({
    team_id: teamId,
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId ?? null,
    metadata: metadata ?? {},
    ip_address: ipAddress ?? null,
  });
}
