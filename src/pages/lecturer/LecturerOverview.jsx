import { CalendarClock, FileText, MessageSquareHeart } from "lucide-react";
import StatCard from "../../components/common/StatCard";
import { usePatientDashboardStats } from "../../hooks/useDashboardStats";
import { useAuth } from "../../contexts/AuthContext";

export default function LecturerOverview() {
  const { profile } = useAuth();
  const { data, isLoading } = usePatientDashboardStats(profile?.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">
          Welcome, {profile?.full_name?.split(" ")[0]}
        </h2>
        <p className="text-sm text-clinic-500">Your personal health summary.</p>
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
        <p className="text-sm text-clinic-500">
          As a lecturer, you only ever see records where you are the patient — enforced both
          here and at the database level via Row Level Security.
        </p>
      </div>
    </div>
  );
}
