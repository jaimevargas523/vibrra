import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useUIStore } from "@/stores/ui.store";
import { useSessionStore } from "@/stores/session.store";
import { formatCOP } from "@/lib/format";
import { StatusDot } from "@/components/ui/StatusDot";
import { NotificationBell } from "@/components/shell/NotificationBell";
import { UserMenu } from "@/components/shell/UserMenu";

interface TopbarProps {
  /** Page title derived from current route */
  title?: string;
  /** Balance amount in COP */
  balance?: number;
  /** Unread notification count */
  notificationCount?: number;
}

export function Topbar({
  title,
  balance = 0,
  notificationCount,
}: TopbarProps) {
  const { t } = useTranslation("common");
  const isMobile = useMediaQuery("(max-width: 899px)");
  const { toggleSidebar } = useUIStore();
  const { isLive } = useSessionStore();

  return (
    <header className="sticky top-0 h-16 bg-surface/80 backdrop-blur border-b border-border z-40 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Left side */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger (mobile only) */}
        {isMobile && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 -ml-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Page title */}
        {title && (
          <h2 className="text-lg font-semibold text-text-primary truncate">
            {title}
          </h2>
        )}
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-4">
        {/* Session indicator */}
        <div className="flex items-center gap-2">
          <StatusDot status={isLive ? "live" : "offline"} size="sm" />
          {isLive && (
            <span className="text-xs font-bold text-green uppercase tracking-wider hidden sm:inline">
              {t("topbar.live")}
            </span>
          )}
        </div>

        {/* Balance */}
        {!isMobile && (
          <span className="font-mono text-gold font-bold text-sm">
            {formatCOP(balance)}
          </span>
        )}

        {/* Notifications */}
        <NotificationBell count={notificationCount} />

        {/* User menu */}
        <UserMenu />
      </div>
    </header>
  );
}
