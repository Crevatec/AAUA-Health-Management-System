import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle2, X } from "lucide-react";
import { useAppointments, useUpdateAppointment, useCancelAppointment } from "../../hooks/useAppointments";
import { formatDateTime } from "../../utils/format";

export default function StaffAppointments() {
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(true);
  const { data: appointments, isLoading } = useAppointments({ upcomingOnly: showUpcomingOnly, limit: 200 });
  const updateAppointment = useUpdateAppointment();
  const { cancel } = useCancelAppointment();

  const markCompleted = async (id) => {
    try {
      await updateAppointment.mutateAsync({ id, status: "completed" });
      toast.success("Marked completed.");
    } catch (err) {
      toast.error(err.message || "Could not update.");
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancel(id);
      toast.success("Appointment cancelled.");
    } catch (err) {
      toast.error(err.message || "Could not cancel.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">Appointments</h2>
          <p className="text-sm text-clinic-500">The clinic's booked schedule.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-clinic-600 dark:text-clinic-300">
          <input
            type="checkbox"
            checked={showUpcomingOnly}
            onChange={(e) => setShowUpcomingOnly(e.target.checked)}
            className="rounded border-clinic-300"
          />
          Upcoming only
        </label>
      </div>

      <div className="card overflow-x-auto p-0">
        {isLoading && <p className="p-5 text-sm text-clinic-400">Loading…</p>}
        {!isLoading && (!appointments || appointments.length === 0) && (
          <p className="p-5 text-sm text-clinic-400">No appointments to show.</p>
        )}
        {appointments && appointments.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-clinic-100 text-xs uppercase tracking-wide text-clinic-400 dark:border-clinic-800">
              <tr>
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Date & time</th>
                <th className="px-5 py-3 font-medium">Reason</th>
                <th className="px-5 py-3 font-medium">Staff</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-clinic-100 dark:divide-clinic-800">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-clinic-50/60 dark:hover:bg-clinic-800/40">
                  <td className="px-5 py-3">
                    <Link to={`/staff/patients/${a.patient_id}`} className="font-medium text-clinic-900 hover:underline dark:text-white">
                      {a.patient?.full_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-clinic-500">{formatDateTime(a.scheduled_date, a.scheduled_time)}</td>
                  <td className="px-5 py-3 text-clinic-600 dark:text-clinic-300">{a.reason}</td>
                  <td className="px-5 py-3 text-clinic-500">{a.medical_staff?.full_name || "Unassigned"}</td>
                  <td className="px-5 py-3"><StatusPill status={a.status} /></td>
                  <td className="px-5 py-3">
                    {(a.status === "booked" || a.status === "rescheduled") && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => markCompleted(a.id)}
                          className="flex items-center gap-1 text-xs font-medium text-clinic-600 hover:underline"
                        >
                          <CheckCircle2 size={14} /> Complete
                        </button>
                        <button
                          onClick={() => handleCancel(a.id)}
                          className="flex items-center gap-1 text-xs font-medium text-clay-600 hover:underline"
                        >
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const styles = {
    booked: "bg-clinic-50 text-clinic-600 dark:bg-clinic-500/10",
    rescheduled: "bg-clay-50 text-clay-600 dark:bg-clay-500/10",
    cancelled: "bg-clinic-100 text-clinic-400 dark:bg-clinic-800",
    completed: "bg-clinic-100 text-clinic-700 dark:bg-clinic-800",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status] || ""}`}>
      {status}
    </span>
  );
}
