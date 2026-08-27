import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

const APPOINTMENT_COLUMNS = `
  id, patient_id, medical_staff_id, scheduled_date, scheduled_time, reason,
  status, reminder_sent, created_at,
  patient:profiles!appointments_patient_id_fkey(full_name, email),
  medical_staff:profiles!appointments_medical_staff_id_fkey(full_name)
`;

export function useAppointments({ patientId, staffId, upcomingOnly, limit = 100 } = {}) {
  return useQuery({
    queryKey: ["appointments", { patientId, staffId, upcomingOnly, limit }],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select(APPOINTMENT_COLUMNS)
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true })
        .limit(limit);

      if (patientId) query = query.eq("patient_id", patientId);
      if (staffId) query = query.eq("medical_staff_id", staffId);
      if (upcomingOnly) {
        const today = new Date().toISOString().slice(0, 10);
        query = query.gte("scheduled_date", today).neq("status", "cancelled");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useAvailableStaff() {
  return useQuery({
    queryKey: ["available-medical-staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medical_staff")
        .select("profile_id, staff_type, profiles!inner(full_name)")
        .order("staff_type");
      if (error) throw error;
      return data;
    },
  });
}

export function useBookAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from("appointments").insert(payload).select().single();
      if (error) throw error;

      // Confirmation notification for the patient (spec: "Appointment confirmations")
      await supabase.from("notifications").insert({
        recipient_id: payload.patient_id,
        type: "appointment_confirmation",
        title: "Appointment booked",
        body: `Your appointment on ${payload.scheduled_date} at ${payload.scheduled_time} has been booked.`,
        related_record_id: data.id,
      });

      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useCancelAppointment() {
  const updateAppointment = useUpdateAppointment();
  return {
    ...updateAppointment,
    cancel: (id) => updateAppointment.mutateAsync({ id, status: "cancelled" }),
  };
}
