import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { useCreateVisit } from "../../hooks/useClinicVisits";
import { usePatientProfile } from "../../hooks/usePatients";
import { useAuth } from "../../contexts/AuthContext";

const schema = z.object({
  reasonForVisit: z.string().min(3, "Enter the reason for this visit"),
  symptoms: z.string().optional(),
  physicalExamination: z.string().optional(),
  temperature: z.string().optional(),
  bloodPressure: z.string().optional(),
  pulseRate: z.string().optional(),
  respiratoryRate: z.string().optional(),
  oxygenSaturation: z.string().optional(),
  diagnosis: z.string().optional(),
  treatmentAdministered: z.string().optional(),
  followUpDate: z.string().optional(),
  doctorsNotes: z.string().optional(),
  status: z.enum(["open", "in_progress", "completed", "referred"]),
});

export default function NewVisit() {
  const [params] = useSearchParams();
  const patientId = params.get("patientId");
  const patientType = params.get("patientType");
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: patientData } = usePatientProfile(patientId, patientType);
  const createVisit = useCreateVisit();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { status: "completed" },
  });

  const onSubmit = async (values) => {
    try {
      const visit = await createVisit.mutateAsync({
        patient_id: patientId,
        attending_staff_id: profile.id,
        reason_for_visit: values.reasonForVisit,
        symptoms: values.symptoms || null,
        physical_examination: values.physicalExamination || null,
        temperature_c: values.temperature ? Number(values.temperature) : null,
        blood_pressure: values.bloodPressure || null,
        pulse_rate: values.pulseRate ? Number(values.pulseRate) : null,
        respiratory_rate: values.respiratoryRate ? Number(values.respiratoryRate) : null,
        oxygen_saturation: values.oxygenSaturation ? Number(values.oxygenSaturation) : null,
        diagnosis: values.diagnosis || null,
        treatment_administered: values.treatmentAdministered || null,
        follow_up_date: values.followUpDate || null,
        doctors_notes: values.doctorsNotes || null,
        status: values.status,
      });
      toast.success("Visit recorded.");
      navigate(`/staff/visits/${visit.id}`, { replace: true });
    } catch (err) {
      toast.error(err.message || "Could not save the visit.");
    }
  };

  if (!patientId) {
    return (
      <p className="text-sm text-clinic-400">
        Start from a patient's profile to record a visit — <Link to="/staff/patients" className="text-clinic-600 hover:underline">search for a patient</Link>.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-clinic-500 hover:text-clinic-700">
        <ArrowLeft size={16} /> Back
      </button>

      <div>
        <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">New clinic visit</h2>
        <p className="text-sm text-clinic-500">
          Patient: <span className="font-medium text-clinic-700 dark:text-clinic-200">{patientData?.profile?.full_name || "…"}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="card space-y-4">
          <h3 className="font-display text-sm font-semibold text-clinic-900 dark:text-white">Reason & symptoms</h3>
          <Field label="Reason for visit" error={errors.reasonForVisit}>
            <input className="input-field" {...register("reasonForVisit")} />
          </Field>
          <Field label="Symptoms">
            <textarea rows={2} className="input-field" {...register("symptoms")} />
          </Field>
          <Field label="Physical examination">
            <textarea rows={2} className="input-field" {...register("physicalExamination")} />
          </Field>
        </div>

        <div className="card space-y-4">
          <h3 className="font-display text-sm font-semibold text-clinic-900 dark:text-white">Vital signs</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Temperature (°C)">
              <input type="number" step="0.1" className="input-field" {...register("temperature")} />
            </Field>
            <Field label="Blood pressure">
              <input placeholder="120/80" className="input-field" {...register("bloodPressure")} />
            </Field>
            <Field label="Pulse rate (bpm)">
              <input type="number" className="input-field" {...register("pulseRate")} />
            </Field>
            <Field label="Respiratory rate">
              <input type="number" className="input-field" {...register("respiratoryRate")} />
            </Field>
            <Field label="O₂ saturation (%)">
              <input type="number" step="0.1" className="input-field" {...register("oxygenSaturation")} />
            </Field>
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-display text-sm font-semibold text-clinic-900 dark:text-white">Diagnosis & treatment</h3>
          <Field label="Diagnosis">
            <textarea rows={2} className="input-field" {...register("diagnosis")} />
          </Field>
          <Field label="Treatment administered">
            <textarea rows={2} className="input-field" {...register("treatmentAdministered")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Follow-up date">
              <input type="date" className="input-field" {...register("followUpDate")} />
            </Field>
            <Field label="Visit status">
              <select className="input-field" {...register("status")}>
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="referred">Referred</option>
              </select>
            </Field>
          </div>
          <Field label="Doctor's notes">
            <textarea rows={3} className="input-field" {...register("doctorsNotes")} />
          </Field>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={createVisit.isPending} className="btn-primary">
            {createVisit.isPending ? "Saving…" : "Save visit"}
          </button>
        </div>
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
