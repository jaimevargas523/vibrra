import { useEffect } from "react";
import {
  LayoutDashboard,
  Radio,
  CalendarDays,
  QrCode,
  ArrowLeftRight,
  Wallet,
  Gift,
  Building2,
  BarChart3,
  UserCircle,
  LogOut,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { EstablishmentSelector } from "@/components/shell/EstablishmentSelector";
import { SidebarNavItem } from "@/components/shell/SidebarNavItem";

interface NavSection {
  labelKey: string;
  items: {
    icon: typeof LayoutDashboard;
    labelKey: string;
    to: string;
    badge?: string;
    end?: boolean;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    labelKey: "sidebar.groups.principal",
    items: [
      { icon: LayoutDashboard, labelKey: "sidebar.items.resumen", to: "/anfitrion", end: true },
      { icon: Radio, labelKey: "sidebar.items.enVivo", to: "/anfitrion/envivo" },
    ],
  },
  {
    labelKey: "sidebar.groups.operaciones",
    items: [
      {
        icon: CalendarDays,
        labelKey: "sidebar.items.sesiones",
        to: "/anfitrion/sesiones",
      },
      { icon: QrCode, labelKey: "sidebar.items.misQrs", to: "/anfitrion/qrs" },
    ],
  },
  {
    labelKey: "sidebar.groups.finanzas",
    items: [
      {
        icon: ArrowLeftRight,
        labelKey: "sidebar.items.movimientos",
        to: "/anfitrion/movimientos",
      },
      { icon: Wallet, labelKey: "sidebar.items.recargar", to: "/anfitrion/recargar" },
      {
        icon: Gift,
        labelKey: "sidebar.items.bonificaciones",
        to: "/anfitrion/bonificaciones",
      },
    ],
  },
  {
    labelKey: "sidebar.groups.configuracion",
    items: [
      {
        icon: Building2,
        labelKey: "sidebar.items.establecimientos",
        to: "/anfitrion/establecimientos",
      },
      {
        icon: BarChart3,
        labelKey: "sidebar.items.analiticas",
        to: "/anfitrion/analytics",
      },
      {
        icon: UserCircle,
        labelKey: "sidebar.items.miCuenta",
        to: "/anfitrion/cuenta",
      },
    ],
  },
];

function SidebarContent() {
  const { t } = useTranslation("common");
  const { logout } = useAuthStore();

  return (
    <div className="flex flex-col h-full bg-surface border-r border-border w-[280px]">
      {/* Logo */}
      <div className="px-6 pt-6 pb-2">
        <img src="/vibrra-logo.svg" alt="VIBRRA" className="h-10 w-auto" />
      </div>

      {/* Establishment selector */}
      <EstablishmentSelector />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.labelKey}>
            <span className="block px-4 mt-6 mb-2 text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
              {t(section.labelKey)}
            </span>
            {section.items.map((item) => (
              <SidebarNavItem
                key={item.to}
                icon={item.icon}
                label={t(item.labelKey)}
                to={item.to}
                badge={item.badge}
                end={item.end}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Logout button */}
      <div className="p-4 border-t border-border">
        <button
          type="button"
          onClick={() => logout()}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-error hover:bg-error/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-[18px] h-[18px]" />
          {t("sidebar.logout")}
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const isMobile = useMediaQuery("(max-width: 899px)");
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  // Auto-close sidebar when switching to mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile, setSidebarOpen]);

  // Desktop: always visible, fixed
  if (!isMobile) {
    return (
      <aside className="fixed top-0 left-0 h-screen z-30">
        <SidebarContent />
      </aside>
    );
  }

  // Mobile: slide-over drawer with backdrop
  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            className="fixed top-0 left-0 h-screen z-50"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
          >
            <SidebarContent />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
