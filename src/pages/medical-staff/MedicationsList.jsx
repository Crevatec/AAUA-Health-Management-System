import { Link } from "react-router-dom";
import { CheckCircle2, Circle } from "lucide-react";
import { useMedications, useMarkDispensed } from "../../hooks/useMedications";
import { formatDate } from "../../utils/format";

export default function MedicationsList() {
  const { data: medications, isLoading } = useMedications();
  const markDispensed = useMarkDispensed();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">Medications</h2>
        <p className="text-sm text-clinic-500">All prescriptions, most recent first. Mark as dispensed once handed out.</p>
      </div>

      <div className="card overflow-x-auto p-0">
        {isLoading && <p className="p-5 text-sm text-clinic-400">Loading…</p>}
        {!isLoading && (!medications || medications.length === 0) && (
          <p className="p-5 text-sm text-clinic-400">No prescriptions recorded yet.</p>
        )}
        {medications && medications.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-clinic-100 text-xs uppercase tracking-wide text-clinic-400 dark:border-clinic-800">
              <tr>
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Medicine</th>
                <th className="px-5 py-3 font-medium">Dosage / Frequency</th>
                <th className="px-5 py-3 font-medium">Prescribed by</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Dispensed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-clinic-100 dark:divide-clinic-800">
              {medications.map((m) => (
                <tr key={m.id} className="hover:bg-clinic-50/60 dark:hover:bg-clinic-800/40">
                  <td className="px-5 py-3">
                    <Link to={`/staff/visits/${m.visit_id}`} className="font-medium text-clinic-900 hover:underline dark:text-white">
                      {m.patient?.full_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-clinic-600 dark:text-clinic-300">{m.medicine_name}</td>
                  <td className="px-5 py-3 text-clinic-500">{m.dosage} · {m.frequency}</td>
                  <td className="px-5 py-3 text-clinic-500">{m.prescribing_staff?.full_name}</td>
                  <td className="px-5 py-3 text-clinic-500">{formatDate(m.created_at)}</td>
                  <td className="px-5 py-3">
                    {m.dispensed_at ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-clinic-600">
                        <CheckCircle2 size={14} /> {formatDate(m.dispensed_at)}
                      </span>
                    ) : (
                      <button
                        onClick={() => markDispensed.mutate(m.id)}
                        disabled={markDispensed.isPending}
                        className="flex items-center gap-1.5 text-xs font-medium text-clay-600 hover:underline"
                      >
                        <Circle size={14} /> Mark dispensed
                      </button>
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
