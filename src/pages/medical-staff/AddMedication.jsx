import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { useClinicVisit } from "../../hooks/useClinicVisits";
import { useCreateMedication } from "../../hooks/useMedications";
import { useAuth } from "../../contexts/AuthContext";

const schema = z.object({
  medicineName: z.string().min(2, "Enter the medicine name"),
  dosage: z.string().min(1, "Enter the dosage"),
  frequency: z.string().min(1, "Enter how often it's taken"),
  duration: z.string().min(1, "Enter the duration"),
  administrationRoute: z.string().optional(),
  quantityDispensed: z.string().optional(),
  pharmacyNotes: z.string().optional(),
});

const ROUTES = ["Oral", "Topical", "Intravenous", "Intramuscular", "Subcutaneous", "Inhalation", "Other"];

export default function AddMedication() {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: visit } = useClinicVisit(visitId);
  const createMedication = useCreateMedication();

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    try {
      await createMedication.mutateAsync({
        visit_id: visitId,
        patient_id: visit.patient_id,
        medicine_name: values.medicineName,
        dosage: values.dosage,
        frequency: values.frequency,
        duration: values.duration,
        administration_route: values.administrationRoute || null,
        quantity_dispensed: values.quantityDispensed ? Number(values.quantityDispensed) : null,
        prescribing_staff_id: profile.id,
        pharmacy_notes: values.pharmacyNotes || null,
      });
      toast.success("Medication prescribed.");
      navigate(`/staff/visits/${visitId}`, { replace: true });
    } catch (err) {
      toast.error(err.message || "Could not save the prescription.");
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-clinic-500 hover:text-clinic-700">
        <ArrowLeft size={16} /> Back to visit
      </button>

      <div>
        <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">Prescribe medication</h2>
        {visit && (
          <p className="text-sm text-clinic-500">
            For <span className="font-medium text-clinic-700 dark:text-clinic-200">{visit.patient?.full_name}</span> — {visit.reason_for_visit}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
        <Field label="Medicine name" error={errors.medicineName}>
          <input className="input-field" {...register("medicineName")} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Dosage" error={errors.dosage}>
            <input placeholder="e.g. 500mg" className="input-field" {...register("dosage")} />
          </Field>
          <Field label="Frequency" error={errors.frequency}>
            <input placeholder="e.g. 3x daily" className="input-field" {...register("frequency")} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Duration" error={errors.duration}>
            <input placeholder="e.g. 5 days" className="input-field" {...register("duration")} />
          </Field>
          <Field label="Administration route">
            <select className="input-field" {...register("administrationRoute")}>
              <option value="">Select</option>
              {ROUTES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Quantity dispensed">
          <input type="number" className="input-field" {...register("quantityDispensed")} />
        </Field>

        <Field label="Pharmacy notes">
          <textarea rows={2} className="input-field" {...register("pharmacyNotes")} />
        </Field>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={createMedication.isPending} className="btn-primary">
            {createMedication.isPending ? "Saving…" : "Save prescription"}
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
