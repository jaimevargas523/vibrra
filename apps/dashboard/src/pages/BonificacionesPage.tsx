import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Gift, CheckCircle } from "lucide-react";
import clsx from "clsx";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

import { useBonificaciones, useReclamarBono } from "@/hooks/api/useBonificaciones";
import { useHostProfile } from "@/hooks/api/useHostProfile";
import { usePais } from "@/hooks/api/usePais";
import { formatShortDate } from "@/lib/format";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

export default function BonificacionesPage() {
  const { t } = useTranslation("bonificaciones");
  const { data, isLoading } = useBonificaciones();
  const { data: profile } = useHostProfile();
  const { data: pais } = usePais();
  const fmt = useCurrencyFormatter();
  const reclamar = useReclamarBono();
  const [reclamadoExito, setReclamadoExito] = useState(false);

  const saldoBono = profile?.saldoBono ?? 0;
  const bonoDisponible = profile?.bonoDisponible ?? false;
  const registroCompleto = profile?.registroCompleto ?? false;
  const yaReclamado = !bonoDisponible && saldoBono > 0 && registroCompleto;

  const totalDisponible = data?.totalDisponible ?? saldoBono;
  const totalReclamado = data?.totalReclamado ?? 0;
  const totalBono = totalDisponible + totalReclamado;
  const usedPercent = totalBono > 0 ? (totalReclamado / totalBono) * 100 : 0;

  const bonoActivacion = pais?.suscripcion?.bonoActivacion ?? 0;
  const planes = pais?.recargaAnfitrion?.planes ?? [];

  function handleReclamar() {
    reclamar.mutate(undefined, {
      onSuccess: () => setReclamadoExito(true),
    });
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* ── Info banner ───────────────────────────────── */}
      <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 flex items-start gap-3">
        <span className="text-xl shrink-0 mt-0.5">{"\uD83D\uDCA1"}</span>
        <div>
          <p className="text-sm font-bold text-gold">
            {t("banner.titulo")}
          </p>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            {t("banner.desc")}
          </p>
        </div>
      </div>

      {/* ── Welcome bonus card ────────────────────────── */}
      <div className="bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
              {t("bienvenida.label")}
            </span>
            <p className="text-[30px] font-bold text-gold-light mt-1 leading-tight">
              {fmt(bonoActivacion)}
            </p>
          </div>
          <Badge variant={yaReclamado || reclamadoExito ? "default" : bonoDisponible ? "gold" : "default"}>
            {yaReclamado || reclamadoExito
              ? t("bienvenida.reclamado")
              : bonoDisponible
                ? t("bienvenida.activo")
                : t("bienvenida.agotado")}
          </Badge>
        </div>

        <div className="border-t border-gold/15 mt-4 pt-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-text-muted">{t("bienvenida.disponible")}</p>
              <p className="font-mono font-semibold text-gold">
                {fmt(totalDisponible)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">{t("bienvenida.usado")}</p>
              <p className="font-mono font-semibold text-text-primary">
                {fmt(totalReclamado)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1 bg-gold-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-gold-light rounded-full transition-all duration-500"
              style={{ width: `${Math.min(usedPercent, 100)}%` }}
            />
          </div>

          <p className="text-[10px] text-text-muted mt-3">
            {t("bienvenida.nota")}
          </p>
          <p className="text-[10px] text-text-muted">
            {t("bienvenida.vence")}
          </p>
        </div>

        {/* Claim bonus button */}
        {reclamadoExito ? (
          <div className="flex items-center gap-2 mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
            <CheckCircle className="w-4 h-4 text-success shrink-0" />
            <p className="text-sm text-success font-medium">
              {t("bienvenida.reclamarExito")}
            </p>
          </div>
        ) : bonoDisponible ? (
          <Button
            className="w-full mt-4"
            size="lg"
            onClick={handleReclamar}
            disabled={reclamar.isPending}
          >
            <Gift className="w-5 h-5" />
            {reclamar.isPending
              ? t("bienvenida.reclamando")
              : t("bienvenida.reclamar")}
          </Button>
        ) : !registroCompleto && saldoBono > 0 ? (
          <Link to="/anfitrion/perfil" className="block mt-4">
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg text-center">
              <p className="text-xs text-warning font-medium">
                {t("bienvenida.completaRegistro")}
              </p>
            </div>
          </Link>
        ) : !yaReclamado ? (
          <div className="bg-gold/5 border border-gold/10 rounded-lg p-3 mt-4">
            <p className="text-xs text-text-secondary leading-relaxed">
              {"\uD83D\uDCA1"} {t("bienvenida.consejo")}
            </p>
          </div>
        ) : null}

        {/* Error */}
        {reclamar.isError && (
          <p className="text-xs text-error mt-2 text-center">
            {(reclamar.error as Error).message}
          </p>
        )}
      </div>

      {/* ── Recharge bonus table ──────────────────────── */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
            {t("tabla.title")}
          </span>
          <Link
            to="/anfitrion/recargar"
            className="text-xs text-gold hover:text-gold-light transition-colors font-medium"
          >
            {t("tabla.recargar")}
          </Link>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-card-dark">
              <th className="px-4 py-3 text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold text-left">
                {t("tabla.cabecera.recarga")}
              </th>
              <th className="px-4 py-3 text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold text-left">
                {t("tabla.cabecera.bono")}
              </th>
              <th className="px-4 py-3 text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold text-left">
                {t("tabla.cabecera.recibes")}
              </th>
            </tr>
          </thead>
          <tbody>
            {planes.map((plan) => (
              <tr
                key={plan.amount}
                className={clsx(
                  "border-t border-border hover:bg-surface-hover transition-colors",
                  plan.recommended && "bg-gold/5 border-gold/20"
                )}
              >
                <td className="px-4 py-3 font-mono font-medium text-text-primary">
                  {fmt(plan.amount)}
                </td>
                <td className="px-4 py-3 font-mono text-success">
                  +{fmt(plan.bonus)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-gold">
                      {fmt(plan.total)}
                    </span>
                    {plan.recommended && (
                      <span className="text-gold">{"\u2605"}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-4 py-3 text-[10px] text-text-muted border-t border-border">
          {"\u2605"} {t("tabla.popular")}. {t("tabla.nota")}
        </p>
      </div>

      {/* ── Bonus history ─────────────────────────────── */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
            {t("historial.title")}
          </span>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : data?.items && data.items.length > 0 ? (
          <div className="divide-y divide-border">
            {data.items.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Gift className="w-4 h-4 text-purple shrink-0" />
                  <div>
                    <p className="text-sm text-text-primary">{b.description}</p>
                    <p className="text-xs text-text-muted">
                      {formatShortDate(new Date(b.createdAt))}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-sm font-semibold text-success shrink-0">
                  +{fmt(b.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-text-muted">
            {t("historial.empty")}
          </div>
        )}
      </div>

      {/* ── CTA ───────────────────────────────────────── */}
      <Link to="/anfitrion/recargar" className="block">
        <Button className="w-full" size="lg">
          <Gift className="w-5 h-5" />
          {t("cta")}
        </Button>
      </Link>
    </div>
  );
}
