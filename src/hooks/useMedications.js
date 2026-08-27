import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { notify } from "./useNotifications";

const MEDICATION_COLUMNS = `
  id, visit_id, patient_id, medicine_name, dosage, frequency, duration,
  administration_route, quantity_dispensed, pharmacy_notes, dispensed_at, created_at,
  patient:profiles!medications_patient_id_fkey(full_name),
  prescribing_staff:profiles!medications_prescribing_staff_id_fkey(full_name)
`;

export function useMedications({ visitId, patientId, limit = 100 } = {}) {
  return useQuery({
    queryKey: ["medications", { visitId, patientId, limit }],
    queryFn: async () => {
      let query = supabase
        .from("medications")
        .select(MEDICATION_COLUMNS)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (visitId) query = query.eq("visit_id", visitId);
      if (patientId) query = query.eq("patient_id", patientId);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateMedication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from("medications").insert(payload).select().single();
      if (error) throw error;

      await notify({
        recipientId: payload.patient_id,
        type: "prescription_available",
        title: "Prescription ready",
        body: `${payload.medicine_name} has been prescribed and is available for pickup at the pharmacy.`,
        relatedRecordId: data.id,
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      queryClient.invalidateQueries({ queryKey: ["medications", { visitId: data.visit_id }] });
    },
  });
}

export function useMarkDispensed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (medicationId) => {
      const { data, error } = await supabase
        .from("medications")
        .update({ dispensed_at: new Date().toISOString() })
        .eq("id", medicationId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["medications"] }),
  });
}
