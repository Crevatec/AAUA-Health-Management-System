import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { useAvailableStaff, useBookAppointment } from "../../hooks/useAppointments";
import { useAuth } from "../../contexts/AuthContext";

const schema = z.object({
  scheduledDate: z.string().min(1, "Choose a date"),
  scheduledTime: z.string().min(1, "Choose a time"),
  medicalStaffId: z.string().optional(),
  reason: z.string().min(3, "Briefly say why you're booking"),
});

const today = new Date().toISOString().slice(0, 10);

export default function BookAppointment() {
  const navigate = useNavigate();
  const { profile, role } = useAuth();
  const { data: staffList } = useAvailableStaff();
  const bookAppointment = useBookAppointment();
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    try {
      await bookAppointment.mutateAsync({
        patient_id: profile.id,
        medical_staff_id: values.medicalStaffId || null,
        scheduled_date: values.scheduledDate,
        scheduled_time: values.scheduledTime,
        reason: values.reason,
        status: "booked",
      });
      toast.success("Appointment booked.");
      setSubmitted(true);
    } catch (err) {
      toast.error(err.message || "Could not book the appointment.");
    }
  };

  const recordsPath = role === "lecturer" ? "/lecturer/appointments" : "/student/appointments";

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <div className="card">
          <p className="mb-4 text-sm text-clinic-700 dark:text-clinic-200">
            Your appointment has been booked. You'll get a reminder closer to the date.
          </p>
          <button onClick={() => navigate(recordsPath)} className="btn-primary">View my appointments</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-clinic-500 hover:text-clinic-700">
        <ArrowLeft size={16} /> Back
      </button>

      <div>
        <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">Book a clinic appointment</h2>
        <p className="text-sm text-clinic-500">Choose a date, time, and briefly tell us why.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" error={errors.scheduledDate}>
            <input type="date" min={today} className="input-field" {...register("scheduledDate")} />
          </Field>
          <Field label="Time" error={errors.scheduledTime}>
            <input type="time" className="input-field" {...register("scheduledTime")} />
          </Field>
        </div>

        <Field label="Preferred medical staff (optional)">
          <select className="input-field" {...register("medicalStaffId")}>
            <option value="">No preference</option>
            {staffList?.map((s) => (
              <option key={s.profile_id} value={s.profile_id}>
                {s.profiles.full_name} — {s.staff_type.replace("_", " ")}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Reason for visit" error={errors.reason}>
          <textarea rows={3} className="input-field" {...register("reason")} />
        </Field>

        <button type="submit" disabled={bookAppointment.isPending} className="btn-primary w-full">
          {bookAppointment.isPending ? "Booking…" : "Book appointment"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-clay-600">{error.message}</p>}
    </div>
  );
}
