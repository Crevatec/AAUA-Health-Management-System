import { Link } from "react-router-dom";
import { useClinicVisits } from "../../hooks/useClinicVisits";
import { formatDateTime } from "../../utils/format";

export default function ClinicVisitsList() {
  const { data: visits, isLoading } = useClinicVisits({ limit: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">Clinic visits</h2>
        <p className="text-sm text-clinic-500">All recorded visits, most recent first.</p>
      </div>

      <div className="card overflow-x-auto p-0">
        {isLoading && <p className="p-5 text-sm text-clinic-400">Loading…</p>}
        {!isLoading && (!visits || visits.length === 0) && (
          <p className="p-5 text-sm text-clinic-400">No visits recorded yet.</p>
        )}
        {visits && visits.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-clinic-100 text-xs uppercase tracking-wide text-clinic-400 dark:border-clinic-800">
              <tr>
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Reason</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Attending staff</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-clinic-100 dark:divide-clinic-800">
              {visits.map((v) => (
                <tr key={v.id} className="hover:bg-clinic-50/60 dark:hover:bg-clinic-800/40">
                  <td className="px-5 py-3">
                    <Link to={`/staff/visits/${v.id}`} className="font-medium text-clinic-900 hover:underline dark:text-white">
                      {v.patient?.full_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-clinic-600 dark:text-clinic-300">{v.reason_for_visit}</td>
                  <td className="px-5 py-3 text-clinic-500">{formatDateTime(v.visit_date, v.visit_time)}</td>
                  <td className="px-5 py-3 text-clinic-500">{v.attending_staff?.full_name}</td>
                  <td className="px-5 py-3 capitalize text-clinic-500">{v.status?.replace("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
