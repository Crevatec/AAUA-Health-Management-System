import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { notify } from "./useNotifications";

const VISIT_COLUMNS = `
  id, patient_id, attending_staff_id, visit_date, visit_time, reason_for_visit,
  symptoms, physical_examination, temperature_c, blood_pressure, pulse_rate,
  respiratory_rate, oxygen_saturation, diagnosis, treatment_administered,
  follow_up_date, doctors_notes, status, created_at,
  patient:profiles!clinic_visits_patient_id_fkey(full_name, email),
  attending_staff:profiles!clinic_visits_attending_staff_id_fkey(full_name)
`;

export function useClinicVisits({ patientId, staffId, limit = 50 } = {}) {
  return useQuery({
    queryKey: ["clinic-visits", { patientId, staffId, limit }],
    queryFn: async () => {
      let query = supabase
        .from("clinic_visits")
        .select(VISIT_COLUMNS)
        .order("visit_date", { ascending: false })
        .order("visit_time", { ascending: false })
        .limit(limit);

      if (patientId) query = query.eq("patient_id", patientId);
      if (staffId) query = query.eq("attending_staff_id", staffId);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useClinicVisit(visitId) {
  return useQuery({
    queryKey: ["clinic-visit", visitId],
    enabled: !!visitId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_visits")
        .select(VISIT_COLUMNS)
        .eq("id", visitId)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from("clinic_visits").insert(payload).select().single();
      if (error) throw error;

      if (payload.follow_up_date) {
        await notify({
          recipientId: payload.patient_id,
          type: "follow_up_reminder",
          title: "Follow-up scheduled",
          body: `A follow-up has been scheduled for ${payload.follow_up_date}. A reminder will follow closer to the date.`,
          relatedRecordId: data.id,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-visits"] });
    },
  });
}

export function useUpdateVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from("clinic_visits")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clinic-visits"] });
      queryClient.invalidateQueries({ queryKey: ["clinic-visit", data.id] });
    },
  });
}

export function useVisitFeedback(visitId) {
  return useQuery({
    queryKey: ["visit-feedback", visitId],
    enabled: !!visitId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medical_feedback")
        .select("*, author:profiles!medical_feedback_author_id_fkey(full_name)")
        .eq("visit_id", visitId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from("medical_feedback").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["visit-feedback", data.visit_id] });
    },
  });
}
