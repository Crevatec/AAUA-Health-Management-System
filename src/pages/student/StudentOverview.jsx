import { CalendarClock, FileText, MessageSquareHeart } from "lucide-react";
import StatCard from "../../components/common/StatCard";
import { usePatientDashboardStats } from "../../hooks/useDashboardStats";
import { useAuth } from "../../contexts/AuthContext";

export default function StudentOverview() {
  const { profile } = useAuth();
  const { data, isLoading } = usePatientDashboardStats(profile?.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">
          Hello, {profile?.full_name?.split(" ")[0]}
        </h2>
        <p className="text-sm text-clinic-500">Your health summary at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Upcoming appointments"
          value={isLoading ? "—" : data.upcomingAppointments}
          icon={CalendarClock}
        />
        <StatCard label="Clinic visits on record" value={isLoading ? "—" : data.visitCount} icon={FileText} />
        <StatCard
          label="Feedback from staff"
          value={isLoading ? "—" : data.feedbackCount}
          icon={MessageSquareHeart}
          accent="clay"
        />
      </div>

      <div className="card">
        <h3 className="mb-3 font-display text-base font-semibold text-clinic-900 dark:text-white">
          Health reminders
        </h3>
        <p className="text-sm text-clinic-500">
          Vaccination due dates and follow-up reminders will surface here from the
          <code className="ml-1 text-xs">notifications</code> table.
        </p>
      </div>
    </div>
  );
}
