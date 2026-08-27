import { supabase } from "./supabaseClient";

/**
 * Fire-and-forget audit trail write. Called from auth and admin actions
 * (the events that matter most for the spec's "audit logs" requirement:
 * logins, and any account/role/status change). Not awaited by callers —
 * a failed audit write should never block the action it's recording.
 */
export async function logAudit({ actorId, action, tableName, recordId, metadata }) {
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action,
    table_name: tableName || null,
    record_id: recordId || null,
    metadata: metadata || null,
  });
  if (error) console.error("Audit log write failed:", error);
}
