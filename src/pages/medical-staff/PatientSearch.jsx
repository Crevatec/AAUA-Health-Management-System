import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Droplet } from "lucide-react";
import { usePatientSearch } from "../../hooks/usePatients";

export default function PatientSearch() {
  const [term, setTerm] = useState("");
  const { data: results, isLoading, isFetching } = usePatientSearch(term);
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">
          Find a patient
        </h2>
        <p className="text-sm text-clinic-500">Search by name, matric number, or staff number.</p>
      </div>

      <div className="relative max-w-lg">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-clinic-300" size={18} />
        <input
          className="input-field pl-10"
          placeholder="e.g. Adebayo, AAUA/CSC/20/1234"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          autoFocus
        />
      </div>

      {term.trim().length > 0 && term.trim().length < 2 && (
        <p className="text-sm text-clinic-400">Keep typing — at least 2 characters.</p>
      )}

      {(isLoading || isFetching) && term.trim().length >= 2 && (
        <p className="text-sm text-clinic-400">Searching…</p>
      )}

      {results && results.length === 0 && (
        <p className="text-sm text-clinic-400">No matching students or lecturers found.</p>
      )}

      {results && results.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/staff/patients/${r.id}`, { state: { type: r.type } })}
              className="card flex items-center gap-3 text-left transition hover:border-clinic-300"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-clinic-100 text-sm font-semibold text-clinic-700 dark:bg-clinic-800 dark:text-clinic-100">
                {r.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-clinic-900 dark:text-white">{r.name}</p>
                <p className="truncate text-xs text-clinic-500">{r.identifier} · {r.subtitle}</p>
              </div>
              {r.bloodGroup && (
                <span className="flex items-center gap-1 rounded-full bg-clay-50 px-2 py-1 text-xs font-medium text-clay-600 dark:bg-clay-500/10">
                  <Droplet size={12} /> {r.bloodGroup}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
