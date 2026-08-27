import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

async function fetchCount(table, filter) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) query = filter(query);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [students, lecturers, medicalStaff, visits, todaysAppointments] = await Promise.all([
        fetchCount("students"),
        fetchCount("lecturers"),
        fetchCount("medical_staff"),
        fetchCount("clinic_visits"),
        fetchCount("appointments", (q) => q.eq("scheduled_date", today)),
      ]);
      return { students, lecturers, medicalStaff, visits, todaysAppointments };
    },
  });
}

export function useStaffDashboardStats(staffId) {
  return useQuery({
    queryKey: ["staff-dashboard-stats", staffId],
    enabled: !!staffId,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [todaysAppointments, pendingLab, recentVisits] = await Promise.all([
        fetchCount("appointments", (q) =>
          q.eq("scheduled_date", today).eq("medical_staff_id", staffId)
        ),
        fetchCount("lab_requests", (q) => q.in("status", ["requested", "in_progress"])),
        fetchCount("clinic_visits", (q) => q.eq("attending_staff_id", staffId)),
      ]);
      return { todaysAppointments, pendingLab, recentVisits };
    },
  });
}

export function usePatientDashboardStats(patientId) {
  return useQuery({
    queryKey: ["patient-dashboard-stats", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [upcomingAppointments, visitCount, feedbackCount] = await Promise.all([
        fetchCount("appointments", (q) =>
          q.eq("patient_id", patientId).gte("scheduled_date", today).eq("status", "booked")
        ),
        fetchCount("clinic_visits", (q) => q.eq("patient_id", patientId)),
        fetchCount("medical_feedback", (q) => q.eq("patient_id", patientId)),
      ]);
      return { upcomingAppointments, visitCount, feedbackCount };
    },
  });
}
