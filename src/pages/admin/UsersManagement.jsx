import { useState } from "react";
import { Search } from "lucide-react";
import toast from "react-hot-toast";
import { useAllUsers, useUpdateUserStatus, useUpdateUserRole } from "../../hooks/useAdminUsers";
import { useAuth } from "../../contexts/AuthContext";
import { formatDate } from "../../utils/format";

const ROLES = ["administrator", "medical_staff", "student", "lecturer"];
const STATUSES = ["active", "inactive", "suspended"];

export default function UsersManagement() {
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { data: users, isLoading } = useAllUsers({ role: roleFilter || undefined, status: statusFilter || undefined, search });
  const updateStatus = useUpdateUserStatus();
  const updateRole = useUpdateUserRole();

  const handleStatusChange = async (id, status) => {
    try {
      await updateStatus.mutateAsync({ id, status, actorId: profile.id });
      toast.success(`Account ${status === "active" ? "activated" : status}.`);
    } catch (err) {
      toast.error(err.message || "Could not update status.");
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await updateRole.mutateAsync({ id, role, actorId: profile.id });
      toast.success("Role updated.");
    } catch (err) {
      toast.error(err.message || "Could not update role.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">User management</h2>
        <p className="text-sm text-clinic-500">Manage accounts, roles, and access across the clinic system.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-clinic-300" size={16} />
          <input
            className="input-field pl-9"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input-field w-auto" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
        </select>
        <select className="input-field w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto p-0">
        {isLoading && <p className="p-5 text-sm text-clinic-400">Loading…</p>}
        {!isLoading && (!users || users.length === 0) && (
          <p className="p-5 text-sm text-clinic-400">No users match these filters.</p>
        )}
        {users && users.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-clinic-100 text-xs uppercase tracking-wide text-clinic-400 dark:border-clinic-800">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-clinic-100 dark:divide-clinic-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-clinic-50/60 dark:hover:bg-clinic-800/40">
                  <td className="px-5 py-3 font-medium text-clinic-900 dark:text-white">{u.full_name}</td>
                  <td className="px-5 py-3 text-clinic-500">{u.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="rounded-md border border-clinic-200 bg-transparent px-2 py-1 text-xs dark:border-clinic-700"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3"><StatusPill status={u.status} /></td>
                  <td className="px-5 py-3 text-clinic-500">{formatDate(u.created_at)}</td>
                  <td className="px-5 py-3">
                    {u.status === "active" ? (
                      <button
                        onClick={() => handleStatusChange(u.id, "inactive")}
                        className="text-xs font-medium text-clay-600 hover:underline"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(u.id, "active")}
                        className="text-xs font-medium text-clinic-600 hover:underline"
                      >
                        Activate
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

function StatusPill({ status }) {
  const styles = {
    active: "bg-clinic-50 text-clinic-600 dark:bg-clinic-500/10",
    inactive: "bg-clinic-100 text-clinic-400 dark:bg-clinic-800",
    suspended: "bg-clay-50 text-clay-600 dark:bg-clay-500/10",
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status] || ""}`}>{status}</span>;
}
