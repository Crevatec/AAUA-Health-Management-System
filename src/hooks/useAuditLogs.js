import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

export function useAuditLogs({ actorId, action, limit = 100 } = {}) {
  return useQuery({
    queryKey: ["audit-logs", { actorId, action, limit }],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("id, actor_id, action, table_name, record_id, metadata, created_at, actor:profiles!audit_logs_actor_id_fkey(full_name, role)")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (actorId) query = query.eq("actor_id", actorId);
      if (action) query = query.eq("action", action);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
