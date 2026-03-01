import { useState, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  CreditCard,
  Lock,
  LogOut,
  Pencil,
  Trash2,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";

import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useHostProfile } from "@/hooks/api/useHostProfile";
import { usePais } from "@/hooks/api/usePais";
import { useAuthStore } from "@/stores/auth.store";
import { apiPut } from "@/lib/api-client";

export default function CuentaPage() {
  const { t } = useTranslation("cuenta");
  const { data: profile, isLoading } = useHostProfile();
  const { data: pais } = usePais();
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  // Modal state
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taxModalOpen, setTaxModalOpen] = useState(false);

  // Bank form state
  const [banco, setBanco] = useState("");
  const [tipoCuenta, setTipoCuenta] = useState("");
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [titularCuenta, setTitularCuenta] = useState("");

  // Tax form state
  const [tipoPersona, setTipoPersona] = useState("");
  const [nit, setNit] = useState("");
  const [regimen, setRegimen] = useState("");
  const [responsableIva, setResponsableIva] = useState("");

  // Password reset state
  const [pwResetSent, setPwResetSent] = useState(false);
  const [pwResetLoading, setPwResetLoading] = useState(false);

  const handlePasswordReset = async () => {
    const email = profile?.email;
    if (!email) return;
    setPwResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setPwResetSent(true);
    } catch {
      // silently fail — don't reveal if email exists
    } finally {
      setPwResetLoading(false);
    }
  };

  // Refs for Enter key navigation
  const tipoCuentaRef = useRef<HTMLSelectElement>(null);
  const numeroCuentaRef = useRef<HTMLInputElement>(null);
  const titularRef = useRef<HTMLInputElement>(null);
  const nitRef = useRef<HTMLInputElement>(null);
  const regimenRef = useRef<HTMLSelectElement>(null);
  const ivaRef = useRef<HTMLSelectElement>(null);

  const hasBankAccount = !!profile?.banco;

  const openBankModal = useCallback(() => {
    // Pre-fill form if editing
    setBanco(profile?.banco ?? "");
    setTipoCuenta(profile?.tipoCuenta ?? "");
    setNumeroCuenta(profile?.numeroCuenta ?? "");
    setTitularCuenta(profile?.titularCuenta ?? "");
    setBankModalOpen(true);
  }, [profile]);

  const closeBankModal = () => setBankModalOpen(false);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () =>
      apiPut("/api/perfil", {
        banco,
        tipoCuenta,
        numeroCuenta,
        titularCuenta,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host-profile"] });
      closeBankModal();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () =>
      apiPut("/api/perfil", {
        banco: "",
        tipoCuenta: "",
        numeroCuenta: "",
        titularCuenta: "",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host-profile"] });
      setDeleteModalOpen(false);
    },
  });

  const handleSave = () => {
    if (!banco || !numeroCuenta) return;
    saveMutation.mutate();
  };

  const canSave = banco.trim() && numeroCuenta.trim();

  // Tax modal
  const openTaxModal = useCallback(() => {
    setTipoPersona(profile?.tipoPersona ?? "");
    setNit(profile?.nit ?? "");
    setRegimen(profile?.regimen ?? "");
    setResponsableIva(
      profile?.responsableIva != null ? (profile.responsableIva ? "si" : "no") : ""
    );
    setTaxModalOpen(true);
  }, [profile]);

  const taxMutation = useMutation({
    mutationFn: () =>
      apiPut("/api/perfil", {
        tipoPersona: tipoPersona || null,
        nit: nit || null,
        regimen: regimen || null,
        responsableIva: responsableIva === "si" ? true : responsableIva === "no" ? false : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host-profile"] });
      setTaxModalOpen(false);
    },
  });

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
                {(profile?.displayName || authUser?.displayName || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-lg font-semibold text-text-primary">
                {profile?.displayName || authUser?.displayName || "Usuario"}
              </p>
              <p className="text-sm text-text-secondary">
                {t("perfil.tipo", { count: profile?.establishmentCount ?? 0 })}
              </p>
            </div>
          </div>
        )}
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-text-secondary">{t("perfil.nombre")}</span>
            <span className="text-sm text-text-primary">{profile?.displayName || authUser?.displayName || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-text-secondary">{t("perfil.email")}</span>
            <span className="text-sm text-text-primary">{profile?.email || authUser?.email || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-text-secondary">{t("perfil.phone")}</span>
            <span className="text-sm text-text-primary">{profile?.phone || "—"}</span>
          </div>
        </div>
      </div>

      {/* Bank account */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold mb-5">
          {t("bancaria.title")}
        </h3>
        {hasBankAccount ? (
          <div className="rounded-lg border border-gold/20 bg-gold/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gold" />
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {profile!.banco}
                    {profile!.tipoCuenta && (
                      <span className="text-text-muted font-normal"> · {
                        pais?.tiposCuenta.find((tc) => tc.key === profile!.tipoCuenta)?.nombre ?? profile!.tipoCuenta
                      }</span>
                    )}
                  </p>
                  {profile!.numeroCuenta && (
                    <p className="text-xs text-text-secondary font-mono mt-0.5">
                      ****{profile!.numeroCuenta.slice(-4)}
                    </p>
                  )}
                  {profile!.titularCuenta && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {profile!.titularCuenta}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant="gold" size="sm">{t("bancaria.principal")}</Badge>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border-light bg-card-dark p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-text-muted" />
              <span className="text-sm text-text-secondary">
                {t("bancaria.sinCuenta")}
              </span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-4 mt-3">
          <button
            type="button"
            onClick={openBankModal}
            className="flex items-center gap-1.5 text-sm text-gold hover:text-gold-light transition-colors cursor-pointer"
          >
            {hasBankAccount ? (
              <>
                <Pencil className="w-3.5 h-3.5" />
                {t("bancaria.editar")}
              </>
            ) : (
              t("bancaria.agregar")
            )}
          </button>
          {hasBankAccount && (
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center gap-1.5 text-sm text-error hover:text-error/80 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t("bancaria.eliminar")}
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-text-muted">{t("bancaria.nota")}</p>
      </div>

      {/* Tax info */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
            {t("tributaria.title")}
          </h3>
          <button
            type="button"
            onClick={openTaxModal}
            className="flex items-center gap-1.5 text-sm text-gold hover:text-gold-light transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
            {t("tributaria.editar")}
          </button>
        </div>
        <div className="space-y-3">
          {[
            {
              label: t("tributaria.tipoPersona"),
              value: profile?.tipoPersona
                ? (pais?.tiposPersona.find((tp) => tp.key === profile.tipoPersona)?.nombre ?? profile.tipoPersona)
                : t("tributaria.noConfigurado"),
            },
            { label: t("tributaria.nit"), value: profile?.nit || t("tributaria.noConfigurado") },
            {
              label: t("tributaria.regimen"),
              value: profile?.regimen
                ? (pais?.regimenesTributarios.find((r) => r.key === profile.regimen)?.nombre ?? profile.regimen)
                : t("tributaria.noConfigurado"),
            },
            { label: t("tributaria.iva"), value: profile?.responsableIva != null ? (profile.responsableIva ? t("tributaria.ivaSi") : t("tributaria.ivaNo")) : t("tributaria.noConfigurado") },
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
            onClick={handlePasswordReset}
            disabled={pwResetSent || pwResetLoading}
            className="flex items-center gap-3 w-full p-4 rounded-lg border border-border hover:bg-surface-hover transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default"
          >
            <Lock className="w-5 h-5 text-text-muted" />
            <div className="text-left">
              <p className="text-sm font-medium text-text-primary">
                {pwResetSent ? t("seguridad.cambiarPwEnviado") : t("seguridad.cambiarPw")}
              </p>
              <p className="text-xs text-text-muted">
                {pwResetSent
                  ? t("seguridad.cambiarPwEnviadoDesc", { email: profile?.email })
                  : t("seguridad.cambiarPwDesc")}
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

      {/* ── Bank account modal ──────────────────────────── */}
      <Modal
        open={bankModalOpen}
        onClose={closeBankModal}
        title={hasBankAccount ? t("bancaria.modalTitleEdit") : t("bancaria.modalTitleAdd")}
        size="md"
        actions={
          <>
            <Button variant="secondary" onClick={closeBankModal}>
              {t("bancaria.cancelar")}
            </Button>
            <Button
              onClick={handleSave}
              loading={saveMutation.isPending}
              disabled={!canSave}
            >
              {t("bancaria.guardar")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Banco */}
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              {t("bancaria.banco")}
            </label>
            <select
              value={banco}
              onChange={(e) => {
                setBanco(e.target.value);
                if (e.target.value) tipoCuentaRef.current?.focus();
              }}
              autoFocus
              className="w-full bg-card-dark border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:border-gold outline-none appearance-none cursor-pointer"
            >
              <option value="">{t("bancaria.seleccionarBanco")}</option>
              {pais?.bancos.map((b) => (
                <option key={b.key} value={b.nombre}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de cuenta */}
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              {t("bancaria.tipoCuenta")}
            </label>
            <select
              ref={tipoCuentaRef}
              value={tipoCuenta}
              onChange={(e) => {
                setTipoCuenta(e.target.value);
                if (e.target.value) numeroCuentaRef.current?.focus();
              }}
              className="w-full bg-card-dark border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:border-gold outline-none appearance-none cursor-pointer"
            >
              <option value="">{t("bancaria.seleccionarTipo")}</option>
              {pais?.tiposCuenta.map((tc) => (
                <option key={tc.key} value={tc.key}>
                  {tc.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Número de cuenta */}
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              {t("bancaria.numeroCuenta")}
            </label>
            <input
              ref={numeroCuentaRef}
              type="text"
              value={numeroCuenta}
              onChange={(e) => setNumeroCuenta(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && titularRef.current?.focus()}
              placeholder={t("bancaria.numeroCuentaPlaceholder")}
              className="w-full bg-card-dark border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:border-gold outline-none font-mono"
            />
          </div>

          {/* Titular */}
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              {t("bancaria.titular")}
            </label>
            <input
              ref={titularRef}
              type="text"
              value={titularCuenta}
              onChange={(e) => setTitularCuenta(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSave) handleSave();
              }}
              placeholder={t("bancaria.titularPlaceholder")}
              className="w-full bg-card-dark border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:border-gold outline-none"
            />
          </div>
        </div>
      </Modal>

      {/* ── Delete confirmation modal ───────────────────── */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t("bancaria.confirmarEliminarTitle")}
        size="sm"
        actions={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              {t("bancaria.cancelar")}
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate()}
              loading={deleteMutation.isPending}
            >
              {t("bancaria.confirmarEliminarBtn")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          {t("bancaria.confirmarEliminarDesc")}
        </p>
      </Modal>

      {/* ── Tax info modal ──────────────────────────────── */}
      <Modal
        open={taxModalOpen}
        onClose={() => setTaxModalOpen(false)}
        title={t("tributaria.title")}
        size="md"
        actions={
          <>
            <Button variant="secondary" onClick={() => setTaxModalOpen(false)}>
              {t("bancaria.cancelar")}
            </Button>
            <Button
              onClick={() => taxMutation.mutate()}
              loading={taxMutation.isPending}
            >
              {t("tributaria.guardar")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Tipo de persona */}
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              {t("tributaria.tipoPersona")}
            </label>
            <select
              value={tipoPersona}
              onChange={(e) => {
                setTipoPersona(e.target.value);
                if (e.target.value) nitRef.current?.focus();
              }}
              autoFocus
              className="w-full bg-card-dark border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:border-gold outline-none appearance-none cursor-pointer"
            >
              <option value="">{t("tributaria.seleccionarTipo")}</option>
              {pais?.tiposPersona.map((tp) => (
                <option key={tp.key} value={tp.key}>
                  {tp.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* NIT / Cédula */}
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              {t("tributaria.nit")}
            </label>
            <input
              ref={nitRef}
              type="text"
              value={nit}
              onChange={(e) => setNit(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && regimenRef.current?.focus()}
              placeholder={t("tributaria.nitPlaceholder")}
              className="w-full bg-card-dark border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:border-gold outline-none font-mono"
            />
          </div>

          {/* Régimen tributario */}
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              {t("tributaria.regimen")}
            </label>
            <select
              ref={regimenRef}
              value={regimen}
              onChange={(e) => {
                setRegimen(e.target.value);
                if (e.target.value) ivaRef.current?.focus();
              }}
              className="w-full bg-card-dark border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:border-gold outline-none appearance-none cursor-pointer"
            >
              <option value="">{t("tributaria.seleccionarRegimen")}</option>
              {pais?.regimenesTributarios.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Responsable IVA */}
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              {t("tributaria.iva")}
            </label>
            <select
              ref={ivaRef}
              value={responsableIva}
              className="w-full bg-card-dark border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:border-gold outline-none appearance-none cursor-pointer"
              onChange={(e) => setResponsableIva(e.target.value)}
            >
              <option value="">{t("tributaria.seleccionarTipo")}</option>
              <option value="si">{t("tributaria.ivaSi")}</option>
              <option value="no">{t("tributaria.ivaNo")}</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
