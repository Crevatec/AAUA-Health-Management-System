import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Guards a route by authentication and, optionally, by role.
 * This is a UX/routing convenience only — the real security boundary is the
 * Postgres Row Level Security policies (supabase/migrations/0003_row_level_security.sql).
 * A user can never see or mutate data they're not entitled to even if this
 * component were bypassed.
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-light dark:bg-surface-dark">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-clinic-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
