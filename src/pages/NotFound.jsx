import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface-light px-4 text-center dark:bg-surface-dark">
      <p className="font-mono text-sm text-clinic-400">404</p>
      <h1 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">
        Page not found
      </h1>
      <Link to="/" className="btn-primary mt-2">Go home</Link>
    </div>
  );
}
