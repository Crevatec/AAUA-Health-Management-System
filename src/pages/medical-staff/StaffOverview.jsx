import { CalendarClock, FlaskConical, ClipboardList } from "lucide-react";
import StatCard from "../../components/common/StatCard";
import { useStaffDashboardStats } from "../../hooks/useDashboardStats";
import { useAuth } from "../../contexts/AuthContext";

export default function StaffOverview() {
  const { profile } = useAuth();
  const { data, isLoading } = useStaffDashboardStats(profile?.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">
          Welcome back, {profile?.full_name?.split(" ")[0]}
        </h2>
        <p className="text-sm text-clinic-500">Here's what's on today at the clinic.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Your appointments today"
          value={isLoading ? "—" : data.todaysAppointments}
          icon={CalendarClock}
        />
        <StatCard
          label="Pending lab results"
          value={isLoading ? "—" : data.pendingLab}
          icon={FlaskConical}
          accent="clay"
        />
        <StatCard label="Visits you've recorded" value={isLoading ? "—" : data.recentVisits} icon={ClipboardList} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 font-display text-base font-semibold text-clinic-900 dark:text-white">
            Today's appointments
          </h3>
          <p className="text-sm text-clinic-500">
            Connects to the <code className="text-xs">appointments</code> table filtered to today
            and your staff ID — build out with the appointment list component next.
          </p>
        </div>
        <div className="card">
          <h3 className="mb-3 font-display text-base font-semibold text-clinic-900 dark:text-white">
            Follow-up cases
          </h3>
          <p className="text-sm text-clinic-500">
            Patients with a <code className="text-xs">follow_up_date</code> due soon on their
            clinic visit record.
          </p>
        </div>
      </div>
    </div>
  );
}
