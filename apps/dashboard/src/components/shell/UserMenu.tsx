import { useState, useRef, useEffect } from "react";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/auth.store";
import clsx from "clsx";

const LANGUAGES = [
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
  { code: "pt", label: "PT" },
] as const;

export function UserMenu() {
  const { user, logout } = useAuthStore();
  const { i18n } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayName = user?.displayName ?? user?.email ?? "U";
  const email = user?.email ?? "";
  const initial = displayName.charAt(0).toUpperCase();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
  };

  const handleLogout = async () => {
    setOpen(false);
    await logout();
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Avatar trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "flex items-center justify-center w-9 h-9 rounded-full bg-gold/20 text-gold text-sm font-bold transition-all cursor-pointer",
          "hover:ring-2 hover:ring-gold/40",
          open && "ring-2 ring-gold/40",
        )}
        aria-label="Menú de usuario"
      >
        {initial}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-surface-elevated border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3">
            <p className="text-sm font-semibold text-text-primary truncate">
              {displayName}
            </p>
            <p className="text-xs text-text-muted truncate mt-0.5">{email}</p>
          </div>

          <div className="h-px bg-border" />

          {/* Language switcher */}
          <div className="px-4 py-3">
            <p className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold mb-2">
              Idioma
            </p>
            <div className="flex gap-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  className={clsx(
                    "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                    i18n.language === lang.code ||
                      i18n.language?.startsWith(lang.code)
                      ? "bg-gold text-[#0A0A0A]"
                      : "bg-surface-hover text-text-secondary hover:text-text-primary",
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-error hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesi&oacute;n
          </button>
        </div>
      )}
    </div>
  );
}
