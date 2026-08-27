import { CheckCheck } from "lucide-react";
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from "../../hooks/useNotifications";
import { useAuth } from "../../contexts/AuthContext";
import { notificationMeta } from "../../utils/notificationMeta";
import { formatDateTime } from "../../utils/format";

export default function NotificationsInbox() {
  const { profile } = useAuth();
  const { data: notifications, isLoading } = useNotifications(profile?.id);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">Notifications</h2>
          <p className="text-sm text-clinic-500">{unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate(profile.id)}
            className="flex items-center gap-1.5 text-sm font-medium text-clinic-600 hover:underline"
          >
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {isLoading && <p className="text-sm text-clinic-400">Loading…</p>}
      {!isLoading && (!notifications || notifications.length === 0) && (
        <div className="card text-center">
          <p className="text-sm text-clinic-500">No notifications yet.</p>
        </div>
      )}

      <div className="space-y-2">
        {notifications?.map((n) => {
          const { icon: Icon, tone } = notificationMeta(n.type);
          return (
            <button
              key={n.id}
              onClick={() => !n.is_read && markRead.mutate(n.id)}
              className={`card flex w-full items-start gap-3 text-left transition ${
                n.is_read ? "opacity-70" : "border-clinic-300"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  tone === "clay" ? "bg-clay-50 text-clay-600 dark:bg-clay-500/10" : "bg-clinic-50 text-clinic-600 dark:bg-clinic-500/10"
                }`}
              >
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-clinic-900 dark:text-white">{n.title}</p>
                  {!n.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-clay-500" />}
                </div>
                <p className="mt-0.5 text-sm text-clinic-500">{n.body}</p>
                <p className="mt-1 text-xs text-clinic-400">{formatDateTime(n.created_at?.slice(0, 10), n.created_at?.slice(11, 19))}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
