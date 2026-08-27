import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { CalendarPlus, X, Pencil } from "lucide-react";
import { useAppointments, useUpdateAppointment, useCancelAppointment } from "../../hooks/useAppointments";
import { useAuth } from "../../contexts/AuthContext";
import { formatDateTime } from "../../utils/format";

export default function MyAppointments() {
  const { profile, role } = useAuth();
  const { data: appointments, isLoading } = useAppointments({ patientId: profile?.id });
  const { cancel, isPending: cancelling } = useCancelAppointment();
  const [reschedulingId, setReschedulingId] = useState(null);

  const bookPath = role === "lecturer" ? "/lecturer/appointments/book" : "/student/appointments/book";

  const handleCancel = async (id) => {
    try {
      await cancel(id);
      toast.success("Appointment cancelled.");
    } catch (err) {
      toast.error(err.message || "Could not cancel the appointment.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">My appointments</h2>
          <p className="text-sm text-clinic-500">Book, reschedule, or cancel your clinic visits.</p>
        </div>
        <Link to={bookPath} className="btn-primary">
          <CalendarPlus size={16} className="mr-1.5" /> Book new
        </Link>
      </div>

      {isLoading && <p className="text-sm text-clinic-400">Loading…</p>}
      {!isLoading && (!appointments || appointments.length === 0) && (
        <div className="card text-center">
          <p className="text-sm text-clinic-500">No appointments yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {appointments?.map((a) =>
          reschedulingId === a.id ? (
            <RescheduleRow key={a.id} appointment={a} onDone={() => setReschedulingId(null)} />
          ) : (
            <div key={a.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-clinic-900 dark:text-white">
                  {formatDateTime(a.scheduled_date, a.scheduled_time)}
                </p>
                <p className="text-xs text-clinic-500">
                  {a.reason} {a.medical_staff?.full_name && `· with ${a.medical_staff.full_name}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={a.status} />
                {a.status === "booked" && (
                  <>
                    <button
                      onClick={() => setReschedulingId(a.id)}
                      className="rounded-lg p-2 text-clinic-500 hover:bg-clinic-50 dark:hover:bg-clinic-800"
                      aria-label="Reschedule"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleCancel(a.id)}
                      disabled={cancelling}
                      className="rounded-lg p-2 text-clay-600 hover:bg-clay-50 dark:hover:bg-clay-500/10"
                      aria-label="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function RescheduleRow({ appointment, onDone }) {
  const [date, setDate] = useState(appointment.scheduled_date);
  const [time, setTime] = useState(appointment.scheduled_time);
  const updateAppointment = useUpdateAppointment();

  const save = async () => {
    try {
      await updateAppointment.mutateAsync({ id: appointment.id, scheduled_date: date, scheduled_time: time, status: "rescheduled" });
      toast.success("Appointment rescheduled.");
      onDone();
    } catch (err) {
      toast.error(err.message || "Could not reschedule.");
    }
  };

  return (
    <div className="card space-y-3">
      <p className="text-sm font-medium text-clinic-900 dark:text-white">Reschedule appointment</p>
      <div className="grid grid-cols-2 gap-3">
        <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
        <input type="time" className="input-field" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onDone} className="btn-secondary text-sm">Cancel</button>
        <button onClick={save} disabled={updateAppointment.isPending} className="btn-primary text-sm">
          {updateAppointment.isPending ? "Saving…" : "Save new time"}
        </button>
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
