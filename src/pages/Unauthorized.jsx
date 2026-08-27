import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface-light px-4 text-center dark:bg-surface-dark">
      <ShieldAlert className="text-clay-500" size={40} />
      <h1 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">
        You don't have access to this page
      </h1>
      <p className="max-w-sm text-sm text-clinic-500">
        Your account role doesn't permit this section. If you believe this is a mistake,
        contact the clinic administrator.
      </p>
      <Link to="/" className="btn-primary mt-2">Go to my dashboard</Link>
    </div>
  );
}
