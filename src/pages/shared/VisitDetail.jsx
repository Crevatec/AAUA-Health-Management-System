import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowLeft, Thermometer, HeartPulse, Wind, Activity, Pill, FlaskConical, Download } from "lucide-react";
import toast from "react-hot-toast";
import { useClinicVisit, useVisitFeedback, useAddFeedback } from "../../hooks/useClinicVisits";
import { useMedications } from "../../hooks/useMedications";
import { useLabRequests } from "../../hooks/useLabRequests";
import { usePatientProfile } from "../../hooks/usePatients";
import { useAuth } from "../../contexts/AuthContext";
import { formatDateTime, formatDate } from "../../utils/format";
import { downloadVisitReport } from "../../lib/pdfReport";

/**
 * Shared between medical staff (full read + feedback) and patients
 * (read-only view of their own visit + feedback). What's actually
 * fetchable is enforced by RLS regardless of which route rendered this.
 */
export default function VisitDetail() {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const { data: visit, isLoading } = useClinicVisit(visitId);
  const { data: feedback } = useVisitFeedback(visitId);
  const { data: medications } = useMedications({ visitId });
  const { data: labRequests } = useLabRequests({ visitId });
  const { data: patientData } = usePatientProfile(visit?.patient_id);
  const { role, profile } = useAuth();
  const [downloading, setDownloading] = useState(false);

  const isStaff = role === "medical_staff" || role === "administrator";

  const handleDownload = async () => {
    if (!patientData?.profile) return;
    setDownloading(true);
    try {
      downloadVisitReport({
        patient: patientData,
        patientType: patientData.type,
        visit,
        medications: medications || [],
        labRequests: (labRequests || []).filter((l) => isStaff || l.status === "approved"),
        feedback: feedback || [],
      });
    } catch {
      toast.error("Could not generate the PDF report.");
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) return <p className="text-sm text-clinic-400">Loading visit…</p>;
  if (!visit) return <p className="text-sm text-clinic-400">Visit not found.</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-clinic-500 hover:text-clinic-700">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">
              {visit.reason_for_visit}
            </h2>
            <p className="text-sm text-clinic-500">
              {formatDateTime(visit.visit_date, visit.visit_time)} · Seen by {visit.attending_staff?.full_name}
              {isStaff && ` · Patient: ${visit.patient?.full_name}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={visit.status} />
            <button
              onClick={handleDownload}
              disabled={downloading || !patientData?.profile}
              className="btn-secondary text-xs"
            >
              <Download size={14} className="mr-1.5" /> {downloading ? "Preparing…" : "Download PDF"}
            </button>
          </div>
        </div>

        {(visit.temperature_c || visit.blood_pressure || visit.pulse_rate || visit.oxygen_saturation) && (
          <div className="mb-5 grid grid-cols-2 gap-3 border-t border-clinic-100 pt-4 dark:border-clinic-800 sm:grid-cols-4">
            <Vital icon={Thermometer} label="Temp" value={visit.temperature_c ? `${visit.temperature_c}°C` : "—"} />
            <Vital icon={HeartPulse} label="BP" value={visit.blood_pressure || "—"} />
            <Vital icon={Activity} label="Pulse" value={visit.pulse_rate ? `${visit.pulse_rate} bpm` : "—"} />
            <Vital icon={Wind} label="SpO₂" value={visit.oxygen_saturation ? `${visit.oxygen_saturation}%` : "—"} />
          </div>
        )}

        <div className="space-y-4 border-t border-clinic-100 pt-4 text-sm dark:border-clinic-800">
          <RecordRow label="Symptoms" value={visit.symptoms} />
          <RecordRow label="Physical examination" value={visit.physical_examination} />
          <RecordRow label="Diagnosis" value={visit.diagnosis} />
          <RecordRow label="Treatment administered" value={visit.treatment_administered} />
          <RecordRow label="Follow-up date" value={visit.follow_up_date ? formatDate(visit.follow_up_date) : null} />
          {isStaff && <RecordRow label="Doctor's notes" value={visit.doctors_notes} />}
        </div>
      </div>

      {isStaff && (
        <div className="flex gap-3">
          <Link to={`/staff/visits/${visitId}/medications`} className="btn-secondary text-sm">Add medication</Link>
          <Link to={`/staff/visits/${visitId}/lab-request`} className="btn-secondary text-sm">Request lab test</Link>
        </div>
      )}

      {medications && medications.length > 0 && (
        <div className="card">
          <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-clinic-900 dark:text-white">
            <Pill size={16} /> Medications prescribed
          </h3>
          <ul className="divide-y divide-clinic-100 dark:divide-clinic-800">
            {medications.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium text-clinic-900 dark:text-white">{m.medicine_name}</p>
                  <p className="text-xs text-clinic-500">{m.dosage} · {m.frequency} · {m.duration}</p>
                </div>
                <span className={`text-xs font-medium ${m.dispensed_at ? "text-clinic-500" : "text-clay-600"}`}>
                  {m.dispensed_at ? `Dispensed ${formatDate(m.dispensed_at)}` : "Pending pickup"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {labRequests && labRequests.length > 0 && (
        <div className="card">
          <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-clinic-900 dark:text-white">
            <FlaskConical size={16} /> Laboratory requests
          </h3>
          <ul className="divide-y divide-clinic-100 dark:divide-clinic-800">
            {labRequests.map((l) => (
              <li key={l.id} className="py-2.5 text-sm">
                {isStaff ? (
                  <Link to={`/staff/lab/${l.id}`} className="font-medium text-clinic-900 hover:underline dark:text-white">
                    {l.test_name}
                  </Link>
                ) : (
                  <p className="font-medium text-clinic-900 dark:text-white">{l.test_name}</p>
                )}
                <p className="text-xs text-clinic-500">{l.test_category} · <span className="capitalize">{l.status.replace("_", " ")}</span></p>
                {l.status === "approved" && l.result_summary && (
                  <p className="mt-1 text-xs text-clinic-600 dark:text-clinic-300">{l.result_summary}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h3 className="mb-3 font-display text-base font-semibold text-clinic-900 dark:text-white">Medical feedback</h3>
        {(!feedback || feedback.length === 0) && (
          <p className="text-sm text-clinic-400">No feedback recorded for this visit yet.</p>
        )}
        <ul className="space-y-4">
          {feedback?.map((f) => (
            <li key={f.id} className="border-t border-clinic-100 pt-3 first:border-0 first:pt-0 dark:border-clinic-800">
              <p className="mb-1 text-xs text-clinic-400">
                {f.author?.full_name} · {formatDate(f.created_at)}
              </p>
              <div className="space-y-1.5 text-sm text-clinic-700 dark:text-clinic-200">
                <RecordRow label="Progress" value={f.progress_notes} compact />
                <RecordRow label="Follow-up instructions" value={f.follow_up_instructions} compact />
                <RecordRow label="Lifestyle" value={f.lifestyle_recommendations} compact />
                <RecordRow label="Diet" value={f.dietary_recommendations} compact />
                <RecordRow label="Exercise" value={f.exercise_recommendations} compact />
                <RecordRow label="Referral" value={f.referral_notes} compact />
                {f.recovery_status && <RecordRow label="Recovery status" value={f.recovery_status} compact />}
                {f.return_to_class !== null && (
                  <p><span className="font-medium text-clinic-500">Return to class:</span> {f.return_to_class ? "Yes" : "Not yet"}</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {isStaff && <FeedbackForm visitId={visitId} patientId={visit.patient_id} authorId={profile.id} />}
      </div>
    </div>
  );
}

function FeedbackForm({ visitId, patientId, authorId }) {
  const addFeedback = useAddFeedback();
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (values) => {
    try {
      await addFeedback.mutateAsync({
        visit_id: visitId,
        patient_id: patientId,
        author_id: authorId,
        progress_notes: values.progressNotes || null,
        follow_up_instructions: values.followUpInstructions || null,
        lifestyle_recommendations: values.lifestyle || null,
        dietary_recommendations: values.diet || null,
        exercise_recommendations: values.exercise || null,
        referral_notes: values.referral || null,
        recovery_status: values.recoveryStatus || null,
        return_to_class: values.returnToClass === "yes",
      });
      toast.success("Feedback added.");
      reset();
    } catch (err) {
      toast.error(err.message || "Could not save feedback.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-3 border-t border-clinic-100 pt-4 dark:border-clinic-800">
      <p className="text-xs font-medium uppercase tracking-wide text-clinic-400">Add feedback</p>
      <textarea rows={2} placeholder="Progress notes" className="input-field" {...register("progressNotes")} />
      <textarea rows={2} placeholder="Follow-up instructions" className="input-field" {...register("followUpInstructions")} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input placeholder="Lifestyle recommendation" className="input-field" {...register("lifestyle")} />
        <input placeholder="Dietary recommendation" className="input-field" {...register("diet")} />
        <input placeholder="Exercise recommendation" className="input-field" {...register("exercise")} />
      </div>
      <textarea rows={2} placeholder="Referral notes (if any)" className="input-field" {...register("referral")} />
      <div className="flex items-center gap-4">
        <input placeholder="Recovery status" className="input-field" {...register("recoveryStatus")} />
        <select className="input-field w-48" {...register("returnToClass")} defaultValue="yes">
          <option value="yes">Can return to class</option>
          <option value="no">Should not return yet</option>
        </select>
      </div>
      <button type="submit" disabled={addFeedback.isPending} className="btn-primary">
        {addFeedback.isPending ? "Saving…" : "Save feedback"}
      </button>
    </form>
  );
}

function Vital({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg bg-clinic-50 p-3 text-center dark:bg-clinic-800/50">
      <Icon size={16} className="mx-auto mb-1 text-clinic-400" />
      <p className="font-display text-sm font-semibold text-clinic-900 dark:text-white">{value}</p>
      <p className="text-xs text-clinic-400">{label}</p>
    </div>
  );
}

function RecordRow({ label, value, compact }) {
  if (!value) return compact ? null : (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-clinic-400">{label}</p>
      <p className="text-clinic-400">Not recorded</p>
    </div>
  );
  return compact ? (
    <p><span className="font-medium text-clinic-500">{label}:</span> {value}</p>
  ) : (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-clinic-400">{label}</p>
      <p className="text-clinic-700 dark:text-clinic-200">{value}</p>
    </div>
  );
}

function StatusPill({ status }) {
  const styles = {
    open: "bg-clay-50 text-clay-600 dark:bg-clay-500/10",
    in_progress: "bg-clay-50 text-clay-600 dark:bg-clay-500/10",
    completed: "bg-clinic-50 text-clinic-600 dark:bg-clinic-500/10",
    referred: "bg-clinic-100 text-clinic-700 dark:bg-clinic-800",
  };
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status] || ""}`}>
      {status?.replace("_", " ")}
    </span>
  );
}
