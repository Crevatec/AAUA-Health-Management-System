import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { notify } from "./useNotifications";

const LAB_COLUMNS = `
  id, visit_id, patient_id, requested_by, test_category, test_name, status,
  result_summary, result_interpretation, scanned_report_url, approved_by,
  approved_at, created_at, updated_at,
  patient:profiles!lab_requests_patient_id_fkey(full_name),
  requester:profiles!lab_requests_requested_by_fkey(full_name),
  approver:profiles!lab_requests_approved_by_fkey(full_name)
`;

export function useLabRequests({ visitId, patientId, status, limit = 100 } = {}) {
  return useQuery({
    queryKey: ["lab-requests", { visitId, patientId, status, limit }],
    queryFn: async () => {
      let query = supabase
        .from("lab_requests")
        .select(LAB_COLUMNS)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (visitId) query = query.eq("visit_id", visitId);
      if (patientId) query = query.eq("patient_id", patientId);
      if (status) query = query.eq("status", status);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useLabRequest(labId) {
  return useQuery({
    queryKey: ["lab-request", labId],
    enabled: !!labId,
    queryFn: async () => {
      const { data, error } = await supabase.from("lab_requests").select(LAB_COLUMNS).eq("id", labId).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateLabRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from("lab_requests").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lab-requests"] }),
  });
}

export function useUpdateLabRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase.from("lab_requests").update(updates).eq("id", id).select().single();
      if (error) throw error;

      if (updates.status === "approved") {
        await notify({
          recipientId: data.patient_id,
          type: "lab_result",
          title: "Lab result available",
          body: `Your ${data.test_name} result has been reviewed and is ready to view.`,
          relatedRecordId: data.id,
        });
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lab-requests"] });
      queryClient.invalidateQueries({ queryKey: ["lab-request", data.id] });
    },
  });
}
