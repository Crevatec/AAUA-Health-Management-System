import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

export function useNotifications(recipientId, { unreadOnly } = {}) {
  return useQuery({
    queryKey: ["notifications", recipientId, { unreadOnly }],
    enabled: !!recipientId,
    queryFn: async () => {
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", recipientId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (unreadOnly) query = query.eq("is_read", false);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useUnreadCount(recipientId) {
  return useQuery({
    queryKey: ["notifications-unread-count", recipientId],
    enabled: !!recipientId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", recipientId)
        .eq("is_read", false);
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 60_000, // light polling — good enough without standing up realtime channels
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (recipientId) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("recipient_id", recipientId)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}

/**
 * Fire-and-forget helper for creating notifications from anywhere in the
 * app (visit save, lab approval, medication dispensed, etc). Not a hook —
 * plain async function so it can be called from within other mutations'
 * onSuccess handlers without violating rules-of-hooks.
 */
export async function notify({ recipientId, type, title, body, relatedRecordId }) {
  const { error } = await supabase.from("notifications").insert({
    recipient_id: recipientId,
    type,
    title,
    body,
    related_record_id: relatedRecordId || null,
  });
  if (error) console.error("Failed to create notification:", error);
}
