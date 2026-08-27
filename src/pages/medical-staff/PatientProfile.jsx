import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Plus, Droplet, Cake, AlertTriangle, Syringe, FileDown } from "lucide-react";
import toast from "react-hot-toast";
import { usePatientProfile } from "../../hooks/usePatients";
import { useClinicVisits } from "../../hooks/useClinicVisits";
import { calculateAge, calculateBmi, bmiCategory, formatDateTime, formatDate } from "../../utils/format";
import { downloadPatientSummary } from "../../lib/pdfReport";

export default function PatientProfile() {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { data, isLoading } = usePatientProfile(patientId, location.state?.type);
  const { data: visits, isLoading: visitsLoading } = useClinicVisits({ patientId });
  const [downloading, setDownloading] = useState(false);

  const handleDownloadSummary = async () => {
    setDownloading(true);
    try {
      downloadPatientSummary({ patient: data, patientType: data.type, visits: visits || [] });
    } catch {
      toast.error("Could not generate the summary report.");
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-clinic-400">Loading patient record…</p>;
  }
  if (!data?.profile) {
    return <p className="text-sm text-clinic-400">Patient not found.</p>;
  }

  const { profile, type, details, allergies, conditions, vaccinations } = data;
  const age = calculateAge(details?.date_of_birth);
  const bmi = calculateBmi(details?.height_cm, details?.weight_kg);
  const bmiInfo = bmiCategory(bmi);

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-clinic-500 hover:text-clinic-700">
        <ArrowLeft size={16} /> Back to search
      </button>

      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-clinic-100 text-lg font-semibold text-clinic-700 dark:bg-clinic-800 dark:text-clinic-100">
            {profile.full_name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">
              {profile.full_name}
            </h2>
            <p className="text-sm text-clinic-500">
              {type === "student" ? details?.matric_number : details?.staff_number} ·{" "}
              {type === "student" ? `${details?.level || "—"} Level, ${details?.programme || "—"}` : "Lecturer"}
              {details?.departments?.name && ` · ${details.departments.name}`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={handleDownloadSummary} disabled={downloading} className="btn-secondary">
            <FileDown size={16} className="mr-1.5" /> {downloading ? "Preparing…" : "Download summary"}
          </button>
          <Link to={`/staff/visits/new?patientId=${patientId}&patientType=${type}`} className="btn-primary">
            <Plus size={16} className="mr-1.5" /> New visit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat icon={Cake} label="Age" value={age ? `${age} yrs` : "—"} />
        <MiniStat icon={Droplet} label="Blood group" value={details?.blood_group || "—"} />
        <MiniStat icon={Droplet} label="Genotype" value={details?.genotype || "—"} />
        <MiniStat
          label="BMI"
          value={bmi ? `${bmi}` : "—"}
          sub={bmiInfo?.label}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h3 className="mb-3 font-display text-base font-semibold text-clinic-900 dark:text-white">
            Clinic visit history
          </h3>
          {visitsLoading && <p className="text-sm text-clinic-400">Loading visits…</p>}
          {!visitsLoading && (!visits || visits.length === 0) && (
            <p className="text-sm text-clinic-400">No clinic visits recorded yet.</p>
          )}
          <div className="divide-y divide-clinic-100 dark:divide-clinic-800">
            {visits?.map((v) => (
              <Link
                key={v.id}
                to={`/staff/visits/${v.id}`}
                className="flex items-center justify-between py-3 hover:bg-clinic-50/60 dark:hover:bg-clinic-800/40"
              >
                <div>
                  <p className="text-sm font-medium text-clinic-900 dark:text-white">{v.reason_for_visit}</p>
                  <p className="text-xs text-clinic-500">
                    {formatDateTime(v.visit_date, v.visit_time)} · {v.attending_staff?.full_name}
                  </p>
                </div>
                <StatusPill status={v.status} />
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-clinic-900 dark:text-white">
              <AlertTriangle size={16} className="text-clay-500" /> Allergies
            </h3>
            {allergies.length === 0 ? (
              <p className="text-sm text-clinic-400">No known allergies.</p>
            ) : (
              <ul className="space-y-1.5">
                {allergies.map((a) => (
                  <li key={a.id} className="text-sm text-clinic-700 dark:text-clinic-200">
                    <span className="font-medium">{a.allergen}</span>
                    {a.severity && <span className="text-clinic-400"> · {a.severity}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h3 className="mb-3 font-display text-sm font-semibold text-clinic-900 dark:text-white">
              Chronic conditions
            </h3>
            {conditions.length === 0 ? (
              <p className="text-sm text-clinic-400">None recorded.</p>
            ) : (
              <ul className="space-y-1.5">
                {conditions.map((c) => (
                  <li key={c.id} className="text-sm text-clinic-700 dark:text-clinic-200">{c.condition_name}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-clinic-900 dark:text-white">
              <Syringe size={16} /> Vaccinations
            </h3>
            {vaccinations.length === 0 ? (
              <p className="text-sm text-clinic-400">None recorded.</p>
            ) : (
              <ul className="space-y-1.5">
                {vaccinations.map((v) => (
                  <li key={v.id} className="text-sm text-clinic-700 dark:text-clinic-200">
                    {v.vaccine_name} <span className="text-clinic-400">· {formatDate(v.administered_on)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, sub }) {
  return (
    <div className="card">
      <div className="mb-1 flex items-center gap-1.5 text-clinic-400">
        {Icon && <Icon size={14} />}
        <span className="text-xs">{label}</span>
      </div>
      <p className="font-display text-lg font-semibold text-clinic-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-clinic-400">{sub}</p>}
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
