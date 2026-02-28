import { Bell } from "lucide-react";
import { useUIStore } from "@/stores/ui.store";
import clsx from "clsx";

interface NotificationBellProps {
  count?: number;
}

export function NotificationBell({ count }: NotificationBellProps) {
  const { notificationsOpen, toggleNotifications } = useUIStore();

  return (
    <button
      type="button"
      onClick={toggleNotifications}
      className={clsx(
        "relative p-2 rounded-lg transition-colors cursor-pointer",
        notificationsOpen
          ? "bg-surface-hover text-text-primary"
          : "text-text-secondary hover:text-text-primary hover:bg-surface-hover",
      )}
      aria-label="Notificaciones"
    >
      <Bell className="w-5 h-5" />
      {count != null && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white text-[10px] font-bold leading-none">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
