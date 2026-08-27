import { useState } from "react";
import { Menu, Bell, Moon, Sun, LogOut, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useUnreadCount } from "../../hooks/useNotifications";
import { roleHomePath } from "../../routes/roleHomePath";

export default function Topbar({ onMenuClick, title }) {
  const { profile, role, signOut } = useAuth();
  const { data: unreadCount } = useUnreadCount(profile?.id);
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDark = () => {
    setDark((d) => {
      document.documentElement.classList.toggle("dark", !d);
      return !d;
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-clinic-100 bg-white/90 px-4 backdrop-blur dark:border-clinic-800 dark:bg-clinic-900/90 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-clinic-500 hover:bg-clinic-50 dark:hover:bg-clinic-800 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold text-clinic-900 dark:text-white">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleDark}
          className="rounded-lg p-2 text-clinic-500 hover:bg-clinic-50 dark:hover:bg-clinic-800"
          aria-label="Toggle dark mode"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          onClick={() => navigate(`${roleHomePath(role)}/notifications`)}
          className="relative rounded-lg p-2 text-clinic-500 hover:bg-clinic-50 dark:hover:bg-clinic-800"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-clinic-50 dark:hover:bg-clinic-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-clinic-100 text-xs font-semibold text-clinic-700 dark:bg-clinic-800 dark:text-clinic-100">
              {profile?.full_name?.slice(0, 1).toUpperCase() || "?"}
            </div>
            <span className="hidden text-sm font-medium text-clinic-700 dark:text-clinic-100 sm:inline">
              {profile?.full_name}
            </span>
            <ChevronDown size={14} className="text-clinic-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-lg border border-clinic-100 bg-white py-1 shadow-card dark:border-clinic-800 dark:bg-clinic-900">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-clay-600 hover:bg-clinic-50 dark:hover:bg-clinic-800"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
