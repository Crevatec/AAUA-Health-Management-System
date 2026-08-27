import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuth } from "../../contexts/AuthContext";

const TITLES = {
  administrator: "Administrator",
  medical_staff: "Clinic Dashboard",
  student: "My Health Portal",
  lecturer: "My Health Portal",
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { role } = useAuth();

  return (
    <div className="flex min-h-screen bg-surface-light dark:bg-surface-dark">
      <Sidebar role={role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col lg:pl-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={TITLES[role] || "Dashboard"} />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
