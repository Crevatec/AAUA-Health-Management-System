import { useState } from "react";
import { Link } from "react-router-dom";
import { useLabRequests } from "../../hooks/useLabRequests";
import { formatDate } from "../../utils/format";

const FILTERS = [
  { value: "", label: "All" },
  { value: "requested", label: "Requested" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "approved", label: "Approved" },
];

export default function LabList() {
  const [status, setStatus] = useState("");
  const { data: requests, isLoading } = useLabRequests({ status: status || undefined });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">Laboratory</h2>
        <p className="text-sm text-clinic-500">Test requests, results, and approvals.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              status === f.value
                ? "bg-clinic-500 text-white"
                : "bg-clinic-50 text-clinic-600 hover:bg-clinic-100 dark:bg-clinic-800 dark:text-clinic-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto p-0">
        {isLoading && <p className="p-5 text-sm text-clinic-400">Loading…</p>}
        {!isLoading && (!requests || requests.length === 0) && (
          <p className="p-5 text-sm text-clinic-400">No lab requests match this filter.</p>
        )}
        {requests && requests.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-clinic-100 text-xs uppercase tracking-wide text-clinic-400 dark:border-clinic-800">
              <tr>
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Test</th>
                <th className="px-5 py-3 font-medium">Requested by</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-clinic-100 dark:divide-clinic-800">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-clinic-50/60 dark:hover:bg-clinic-800/40">
                  <td className="px-5 py-3">
                    <Link to={`/staff/lab/${r.id}`} className="font-medium text-clinic-900 hover:underline dark:text-white">
                      {r.patient?.full_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-clinic-600 dark:text-clinic-300">{r.test_name}<span className="block text-xs text-clinic-400">{r.test_category}</span></td>
                  <td className="px-5 py-3 text-clinic-500">{r.requester?.full_name}</td>
                  <td className="px-5 py-3 text-clinic-500">{formatDate(r.created_at)}</td>
                  <td className="px-5 py-3"><LabStatusPill status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export function LabStatusPill({ status }) {
  const styles = {
    requested: "bg-clay-50 text-clay-600 dark:bg-clay-500/10",
    in_progress: "bg-clay-50 text-clay-600 dark:bg-clay-500/10",
    completed: "bg-clinic-50 text-clinic-600 dark:bg-clinic-500/10",
    approved: "bg-clinic-100 text-clinic-700 dark:bg-clinic-800",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status] || ""}`}>
      {status?.replace("_", " ")}
    </span>
  );
}
