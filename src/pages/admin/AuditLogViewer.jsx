import { useState } from "react";
import { useAuditLogs } from "../../hooks/useAuditLogs";
import { formatDateTime } from "../../utils/format";

const ACTIONS = [
  { value: "", label: "All actions" },
  { value: "login", label: "Login" },
  { value: "update_user_status", label: "Account status change" },
  { value: "update_user_role", label: "Role change" },
];

export default function AuditLogViewer() {
  const [action, setAction] = useState("");
  const { data: logs, isLoading } = useAuditLogs({ action: action || undefined });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">Audit logs</h2>
        <p className="text-sm text-clinic-500">A record of security-relevant actions across the system.</p>
      </div>

      <select className="input-field w-auto" value={action} onChange={(e) => setAction(e.target.value)}>
        {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
      </select>

      <div className="card overflow-x-auto p-0">
        {isLoading && <p className="p-5 text-sm text-clinic-400">Loading…</p>}
        {!isLoading && (!logs || logs.length === 0) && (
          <p className="p-5 text-sm text-clinic-400">No audit entries match this filter.</p>
        )}
        {logs && logs.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-clinic-100 text-xs uppercase tracking-wide text-clinic-400 dark:border-clinic-800">
              <tr>
                <th className="px-5 py-3 font-medium">Actor</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Table</th>
                <th className="px-5 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-clinic-100 dark:divide-clinic-800">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-clinic-50/60 dark:hover:bg-clinic-800/40">
                  <td className="px-5 py-3">
                    <span className="font-medium text-clinic-900 dark:text-white">{l.actor?.full_name || "Unknown"}</span>
                    {l.actor?.role && <span className="ml-1.5 text-xs text-clinic-400 capitalize">({l.actor.role.replace("_", " ")})</span>}
                  </td>
                  <td className="px-5 py-3 text-clinic-600 dark:text-clinic-300 capitalize">{l.action.replace(/_/g, " ")}</td>
                  <td className="px-5 py-3 text-clinic-500">{l.table_name || "—"}</td>
                  <td className="px-5 py-3 text-clinic-500">{formatDateTime(l.created_at?.slice(0, 10), l.created_at?.slice(11, 19))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
