import { useTranslation } from "react-i18next";
import {
  User,
  Mail,
  Building2,
  CreditCard,
  Shield,
  FileText,
  Lock,
  LogOut,
} from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

import { useHostProfile } from "@/hooks/api/useHostProfile";
import { useAuthStore } from "@/stores/auth.store";
import { Skeleton } from "@/components/ui/Skeleton";

export default function CuentaPage() {
  const { t } = useTranslation("cuenta");
  const { data: profile, isLoading } = useHostProfile();
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title={t("title")} />

      {/* Profile */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold mb-5">
          {t("perfil.title")}
        </h3>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-5 w-48" />
          </div>
        ) : (
          <div className="flex items-center gap-4 mb-5">
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.displayName}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-muted text-2xl font-bold text-gold">
                {profile?.displayName?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <div>
              <p className="text-lg font-semibold text-text-primary">
                {profile?.displayName || "Usuario"}
              </p>
              <p className="text-sm text-text-secondary">
                {t("perfil.tipo", { count: profile?.establishmentCount ?? 0 })}
              </p>
            </div>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              {t("perfil.nombre")}
            </label>
            <input
              type="text"
              defaultValue={profile?.displayName || ""}
              className="w-full bg-card-dark border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              {t("perfil.email")}
            </label>
            <div className="flex items-center gap-2 bg-card-dark border border-border rounded-lg px-4 py-3">
              <Mail className="w-4 h-4 text-text-muted" />
              <span className="text-sm text-text-secondary">
                {profile?.email || ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bank account */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold mb-5">
          {t("bancaria.title")}
        </h3>
        <div className="rounded-lg border border-border-light bg-card-dark p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-text-muted" />
              <span className="text-sm text-text-secondary">
                {t("bancaria.sinCuenta")}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="mt-3 text-sm text-gold hover:text-gold-light transition-colors"
        >
          {t("bancaria.agregar")}
        </button>
        <p className="mt-3 text-xs text-text-muted">{t("bancaria.nota")}</p>
      </div>

      {/* Tax info */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold mb-5">
          {t("tributaria.title")}
        </h3>
        <div className="space-y-3">
          {[
            { label: t("tributaria.tipoPersona"), value: t("tributaria.noConfigurado") },
            { label: t("tributaria.nit"), value: t("tributaria.noConfigurado") },
            { label: t("tributaria.regimen"), value: t("tributaria.noConfigurado") },
            { label: t("tributaria.iva"), value: t("tributaria.noConfigurado") },
            { label: t("tributaria.retencion"), value: t("tributaria.retencionVal") },
            { label: t("tributaria.ica"), value: t("tributaria.icaVal") },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <span className="text-sm text-text-secondary">{item.label}</span>
              <span className="text-sm text-text-primary">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold mb-5">
          {t("seguridad.title")}
        </h3>
        <div className="space-y-3">
          <button
            type="button"
            className="flex items-center gap-3 w-full p-4 rounded-lg border border-border hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <Lock className="w-5 h-5 text-text-muted" />
            <div className="text-left">
              <p className="text-sm font-medium text-text-primary">
                {t("seguridad.cambiarPw")}
              </p>
              <p className="text-xs text-text-muted">
                {t("seguridad.cambiarPwDesc")}
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center gap-3 w-full p-4 rounded-lg border border-error/20 hover:bg-error/5 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5 text-error" />
            <span className="text-sm font-medium text-error">
              {t("seguridad.cerrarSesion")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
