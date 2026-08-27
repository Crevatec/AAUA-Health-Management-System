import { Users, GraduationCap, Stethoscope, ClipboardList, CalendarClock } from "lucide-react";
import StatCard from "../../components/common/StatCard";
import { useAdminDashboardStats } from "../../hooks/useDashboardStats";

export default function AdminOverview() {
  const { data, isLoading, isError } = useAdminDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">
          Clinic overview
        </h2>
        <p className="text-sm text-clinic-500">System-wide snapshot for the AAUA clinic, Ibadan Campus.</p>
      </div>

      {isError && (
        <div className="card border-clay-100 bg-clay-50 text-sm text-clay-600">
          Couldn't load statistics right now. Try refreshing.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Students" value={isLoading ? "—" : data.students} icon={GraduationCap} />
        <StatCard label="Lecturers" value={isLoading ? "—" : data.lecturers} icon={Users} />
        <StatCard label="Medical staff" value={isLoading ? "—" : data.medicalStaff} icon={Stethoscope} />
        <StatCard label="Total clinic visits" value={isLoading ? "—" : data.visits} icon={ClipboardList} />
        <StatCard
          label="Today's appointments"
          value={isLoading ? "—" : data.todaysAppointments}
          icon={CalendarClock}
          accent="clay"
        />
      </div>

      <div className="card">
        <h3 className="mb-3 font-display text-base font-semibold text-clinic-900 dark:text-white">
          Recent activity
        </h3>
        <p className="text-sm text-clinic-500">
          Activity feed (recent registrations, visits, and lab results) wires up once the
          audit log view is connected — see <code className="text-xs">audit_logs</code> in the schema.
        </p>
      </div>
    </div>
  );
}
