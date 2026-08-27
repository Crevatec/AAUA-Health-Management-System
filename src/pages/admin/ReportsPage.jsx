import { useQuery } from "@tanstack/react-query";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend,
} from "chart.js";
import { supabase } from "../../lib/supabaseClient";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function useVisitsByDay() {
  return useQuery({
    queryKey: ["report-visits-by-day"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 13);
      const { data, error } = await supabase
        .from("clinic_visits")
        .select("visit_date")
        .gte("visit_date", since.toISOString().slice(0, 10));
      if (error) throw error;

      const counts = {};
      for (let i = 0; i < 14; i++) {
        const d = new Date(since);
        d.setDate(d.getDate() + i);
        counts[d.toISOString().slice(0, 10)] = 0;
      }
      data.forEach((v) => {
        if (counts[v.visit_date] !== undefined) counts[v.visit_date]++;
      });
      return counts;
    },
  });
}

function useRoleBreakdown() {
  return useQuery({
    queryKey: ["report-role-breakdown"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("role");
      if (error) throw error;
      const counts = { student: 0, lecturer: 0, medical_staff: 0, administrator: 0 };
      data.forEach((p) => { counts[p.role] = (counts[p.role] || 0) + 1; });
      return counts;
    },
  });
}

function useVisitStatusBreakdown() {
  return useQuery({
    queryKey: ["report-visit-status"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clinic_visits").select("status");
      if (error) throw error;
      const counts = { open: 0, in_progress: 0, completed: 0, referred: 0 };
      data.forEach((v) => { counts[v.status] = (counts[v.status] || 0) + 1; });
      return counts;
    },
  });
}

const CLINIC_COLOR = "#0F6B5C";
const PALETTE = ["#0F6B5C", "#4C9C88", "#C06B3C", "#D98A5F"];

export default function ReportsPage() {
  const { data: byDay, isLoading: byDayLoading } = useVisitsByDay();
  const { data: roles, isLoading: rolesLoading } = useRoleBreakdown();
  const { data: statuses, isLoading: statusesLoading } = useVisitStatusBreakdown();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">Reports & analytics</h2>
        <p className="text-sm text-clinic-500">System-wide trends across the clinic.</p>
      </div>

      <div className="card">
        <h3 className="mb-4 font-display text-sm font-semibold text-clinic-900 dark:text-white">Clinic visits — last 14 days</h3>
        {byDayLoading ? (
          <p className="text-sm text-clinic-400">Loading…</p>
        ) : (
          <Bar
            data={{
              labels: Object.keys(byDay).map((d) => d.slice(5)),
              datasets: [{ label: "Visits", data: Object.values(byDay), backgroundColor: CLINIC_COLOR, borderRadius: 4 }],
            }}
            options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 font-display text-sm font-semibold text-clinic-900 dark:text-white">Users by role</h3>
          {rolesLoading ? (
            <p className="text-sm text-clinic-400">Loading…</p>
          ) : (
            <Doughnut
              data={{
                labels: Object.keys(roles).map((r) => r.replace("_", " ")),
                datasets: [{ data: Object.values(roles), backgroundColor: PALETTE }],
              }}
              options={{ responsive: true, plugins: { legend: { position: "bottom" } } }}
            />
          )}
        </div>

        <div className="card">
          <h3 className="mb-4 font-display text-sm font-semibold text-clinic-900 dark:text-white">Visit status breakdown</h3>
          {statusesLoading ? (
            <p className="text-sm text-clinic-400">Loading…</p>
          ) : (
            <Doughnut
              data={{
                labels: Object.keys(statuses).map((s) => s.replace("_", " ")),
                datasets: [{ data: Object.values(statuses), backgroundColor: PALETTE }],
              }}
              options={{ responsive: true, plugins: { legend: { position: "bottom" } } }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
