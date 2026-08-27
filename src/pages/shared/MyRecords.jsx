import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { useClinicVisits } from "../../hooks/useClinicVisits";
import { useAuth } from "../../contexts/AuthContext";
import { formatDateTime } from "../../utils/format";

/**
 * Used by both /student/records and /lecturer/records — same query
 * (own patient_id, enforced by RLS), same read-only presentation.
 */
export default function MyRecords() {
  const { profile } = useAuth();
  const { data: visits, isLoading } = useClinicVisits({ patientId: profile?.id, limit: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">My medical records</h2>
        <p className="text-sm text-clinic-500">Your clinic visit history, diagnoses, and feedback from staff.</p>
      </div>

      {isLoading && <p className="text-sm text-clinic-400">Loading…</p>}
      {!isLoading && (!visits || visits.length === 0) && (
        <div className="card text-center">
          <FileText className="mx-auto mb-2 text-clinic-300" size={28} />
          <p className="text-sm text-clinic-500">No clinic visits recorded yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {visits?.map((v) => (
          <Link
            key={v.id}
            to={`/${profile.role === "lecturer" ? "lecturer" : "student"}/records/${v.id}`}
            className="card flex items-center justify-between transition hover:border-clinic-300"
          >
            <div>
              <p className="text-sm font-medium text-clinic-900 dark:text-white">{v.reason_for_visit}</p>
              <p className="text-xs text-clinic-500">
                {formatDateTime(v.visit_date, v.visit_time)} · {v.attending_staff?.full_name}
              </p>
            </div>
            <span className="rounded-full bg-clinic-50 px-2.5 py-1 text-xs font-medium capitalize text-clinic-600 dark:bg-clinic-800">
              {v.status?.replace("_", " ")}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
