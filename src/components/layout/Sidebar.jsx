import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Stethoscope, Pill, FlaskConical, CalendarClock,
  Bell, FileText, Settings, Building2, ShieldCheck, User,
} from "lucide-react";

const NAV_BY_ROLE = {
  administrator: [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/faculties", label: "Faculties & Depts", icon: Building2 },
    { to: "/admin/reports", label: "Reports", icon: FileText },
    { to: "/admin/audit", label: "Audit Logs", icon: ShieldCheck },
    { to: "/admin/notifications", label: "Notifications", icon: Bell },
    { to: "/admin/settings", label: "Clinic Settings", icon: Settings },
  ],
  medical_staff: [
    { to: "/staff", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/staff/patients", label: "Patients", icon: Users },
    { to: "/staff/visits", label: "Clinic Visits", icon: Stethoscope },
    { to: "/staff/medications", label: "Medications", icon: Pill },
    { to: "/staff/lab", label: "Laboratory", icon: FlaskConical },
    { to: "/staff/appointments", label: "Appointments", icon: CalendarClock },
    { to: "/staff/notifications", label: "Notifications", icon: Bell },
  ],
  student: [
    { to: "/student", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/student/records", label: "My Records", icon: FileText },
    { to: "/student/appointments", label: "Appointments", icon: CalendarClock },
    { to: "/student/notifications", label: "Notifications", icon: Bell },
    { to: "/student/profile", label: "Profile", icon: User },
  ],
  lecturer: [
    { to: "/lecturer", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/lecturer/records", label: "My Records", icon: FileText },
    { to: "/lecturer/appointments", label: "Appointments", icon: CalendarClock },
    { to: "/lecturer/notifications", label: "Notifications", icon: Bell },
    { to: "/lecturer/profile", label: "Profile", icon: User },
  ],
};

export default function Sidebar({ role, open, onClose }) {
  const items = NAV_BY_ROLE[role] || [];

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-clinic-100 bg-white transition-transform dark:border-clinic-800 dark:bg-clinic-900 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-clinic-100 px-5 dark:border-clinic-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-clinic-500 text-xs font-display font-semibold text-white">
            AA
          </div>
          <span className="font-display text-sm font-semibold text-clinic-900 dark:text-white">
            AAUA Clinic — Ibadan
          </span>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-clinic-50 text-clinic-700 dark:bg-clinic-800 dark:text-white"
                    : "text-clinic-500 hover:bg-clinic-50 hover:text-clinic-700 dark:text-clinic-300 dark:hover:bg-clinic-800"
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
