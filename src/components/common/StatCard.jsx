export default function StatCard({ label, value, icon: Icon, accent = "clinic" }) {
  const accentClasses =
    accent === "clay"
      ? "bg-clay-50 text-clay-600 dark:bg-clay-500/10"
      : "bg-clinic-50 text-clinic-600 dark:bg-clinic-500/10";

  return (
    <div className="card flex items-center gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${accentClasses}`}>
        {Icon && <Icon size={20} />}
      </div>
      <div>
        <p className="text-2xl font-display font-semibold text-clinic-900 dark:text-white">{value}</p>
        <p className="text-sm text-clinic-500">{label}</p>
      </div>
    </div>
  );
}
