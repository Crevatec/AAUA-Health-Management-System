import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { logAudit } from "../lib/audit";

export function useAllUsers({ role, status, search } = {}) {
  return useQuery({
    queryKey: ["admin-users", { role, status, search }],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, role, status, full_name, email, phone, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (role) query = query.eq("role", role);
      if (status) query = query.eq("status", status);
      if (search && search.trim().length >= 2) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, actorId }) => {
      const { data, error } = await supabase.from("profiles").update({ status }).eq("id", id).select().single();
      if (error) throw error;
      await logAudit({ actorId, action: "update_user_status", tableName: "profiles", recordId: id, metadata: { status } });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role, actorId }) => {
      const { data, error } = await supabase.from("profiles").update({ role }).eq("id", id).select().single();
      if (error) throw error;
      await logAudit({ actorId, action: "update_user_role", tableName: "profiles", recordId: id, metadata: { role } });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}
