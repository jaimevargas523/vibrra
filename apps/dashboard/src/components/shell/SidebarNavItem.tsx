import { NavLink } from "react-router";
import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

interface SidebarNavItemProps {
  icon: LucideIcon;
  label: string;
  to: string;
  badge?: string;
}

export function SidebarNavItem({
  icon: Icon,
  label,
  to,
  badge,
}: SidebarNavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-200 group relative",
          isActive
            ? "border-l-[3px] border-gold bg-gold-muted text-gold"
            : "text-text-secondary hover:bg-surface-hover hover:text-text-primary border-l-[3px] border-transparent",
        )
      }
    >
      <Icon className="w-[18px] h-[18px] shrink-0" />
      <span className="truncate">{label}</span>
      {badge && (
        <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-error text-white text-[10px] font-bold leading-none">
          {badge}
        </span>
      )}
    </NavLink>
  );
}
