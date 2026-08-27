import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { useClinicVisit } from "../../hooks/useClinicVisits";
import { useCreateLabRequest } from "../../hooks/useLabRequests";
import { useAuth } from "../../contexts/AuthContext";

const schema = z.object({
  testCategory: z.string().min(2, "Enter the test category"),
  testName: z.string().min(2, "Enter the specific test name"),
});

const CATEGORIES = ["Haematology", "Chemistry/Biochemistry", "Microbiology", "Serology", "Urinalysis", "Imaging", "Other"];

export default function AddLabRequest() {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: visit } = useClinicVisit(visitId);
  const createLabRequest = useCreateLabRequest();

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    try {
      await createLabRequest.mutateAsync({
        visit_id: visitId,
        patient_id: visit.patient_id,
        requested_by: profile.id,
        test_category: values.testCategory,
        test_name: values.testName,
        status: "requested",
      });
      toast.success("Lab test requested.");
      navigate(`/staff/visits/${visitId}`, { replace: true });
    } catch (err) {
      toast.error(err.message || "Could not save the lab request.");
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-clinic-500 hover:text-clinic-700">
        <ArrowLeft size={16} /> Back to visit
      </button>

      <div>
        <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">Request laboratory test</h2>
        {visit && (
          <p className="text-sm text-clinic-500">
            For <span className="font-medium text-clinic-700 dark:text-clinic-200">{visit.patient?.full_name}</span> — {visit.reason_for_visit}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
        <Field label="Test category" error={errors.testCategory}>
          <select className="input-field" {...register("testCategory")}>
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <Field label="Specific test" error={errors.testName}>
          <input placeholder="e.g. Full Blood Count, Malaria Parasite Test" className="input-field" {...register("testName")} />
        </Field>

        <p className="text-xs text-clinic-400">
          The result, interpretation, and any scanned report are added later by laboratory staff
          from the Laboratory page once the sample has been processed.
        </p>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={createLabRequest.isPending} className="btn-primary">
            {createLabRequest.isPending ? "Saving…" : "Submit request"}
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
