import { useTranslation } from "react-i18next";
import { CreditCard, Check, AlertTriangle } from "lucide-react";
import clsx from "clsx";

import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

import { useSuscripcion } from "@/hooks/api/useSuscripcion";
import { useEstablecimientos } from "@/hooks/api/useEstablecimientos";
import { formatCOP, formatShortDate } from "@/lib/format";

/* ── Fallback data ───────────────────────────────────────────── */

const fallbackEstablishments = [
  {
    id: "e1",
    name: "La Terraza Rooftop",
    city: "Bogota",
    emoji: "\uD83C\uDF1F",
    valorMensual: 89000,
    proximoCobro: "1 mar 2026",
    mesesPagados: 4,
    status: "activa" as const,
    historial: [
      { fecha: "1 feb 2026", monto: 89000, status: "pagado" },
      { fecha: "1 ene 2026", monto: 89000, status: "pagado" },
    ],
  },
  {
    id: "e2",
    name: "Bar El Dorado",
    city: "Medellin",
    emoji: "\uD83C\uDFB5",
    valorMensual: 89000,
    proximoCobro: "1 mar 2026",
    mesesPagados: 2,
    status: "activa" as const,
    historial: [
      { fecha: "1 feb 2026", monto: 89000, status: "pagado" },
    ],
  },
];

export default function SuscripcionPage() {
  const { t } = useTranslation("suscripcion");
  const { data: suscripcion, isLoading: subLoading } = useSuscripcion();
  const { data: establecimientos, isLoading: estLoading } = useEstablecimientos();

  const loading = subLoading && estLoading;
  const estCount = establecimientos?.length || fallbackEstablishments.length;
  const precioMensual = suscripcion?.precioMensual ?? 89000;
  const totalMensual = precioMensual * estCount;

  const planLabel =
    suscripcion?.plan === "profesional"
      ? "Profesional"
      : suscripcion?.plan === "basico"
        ? "Basico"
        : suscripcion?.plan === "empresarial"
          ? "Empresarial"
          : "Gratuito";

  const estData = establecimientos?.length
    ? establecimientos.map((est) => ({
        ...est,
        emoji: est.type === "bar" ? "\uD83C\uDF7A" : "\uD83C\uDFB5",
        valorMensual: precioMensual,
        proximoCobro: suscripcion
          ? formatShortDate(new Date(suscripcion.fechaRenovacion))
          : "1 mar 2026",
        mesesPagados: suscripcion
          ? calcMesesPagados(suscripcion.fechaInicio)
          : 0,
        status: suscripcion?.estado ?? "activa",
        historial: [] as { fecha: string; monto: number; status: string }[],
      }))
    : fallbackEstablishments;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader title="Suscripcion" />
        <Skeleton variant="card" className="h-40" />
        <Skeleton variant="card" className="h-64" />
      </div>
    );
  }

  if (estData.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader title="Suscripcion" />
        <EmptyState
          icon={<CreditCard className="w-16 h-16" />}
          title="Sin establecimientos"
          description="Agrega un establecimiento para ver los detalles de tu suscripcion."
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Suscripcion" subtitle="Gestion de planes y cobros mensuales" />

      {/* ── Global summary ────────────────────────────── */}
      <div className="bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 rounded-xl p-6 text-center">
        <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
          TOTAL SUSCRIPCIONES ACTIVAS
        </span>
        <p className="text-[26px] font-mono font-bold text-gold-light mt-2 leading-tight">
          {formatCOP(totalMensual)} / mes
        </p>
        <p className="text-sm text-text-secondary mt-1">
          {estCount} establecimiento{estCount > 1 ? "s" : ""} · Plan {planLabel}
        </p>
        <p className="text-xs text-text-muted mt-2">
          IVA no aplica (SaaS)
        </p>
        <p className="text-xs text-text-muted">
          Cobro automatico el dia 1 de cada mes
        </p>
      </div>

      {/* ── Card per establishment ────────────────────── */}
      {estData.map((est) => {
        const statusLabel =
          est.status === "activa"
            ? "ACTIVA"
            : est.status === "vencida"
              ? "VENCIDA"
              : "CANCELADA";
        const statusVariant =
          est.status === "activa"
            ? "success"
            : est.status === "vencida"
              ? "warning"
              : ("error" as const);

        return (
          <div
            key={est.id}
            className="bg-surface rounded-xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-elevated text-xl">
                  {est.emoji}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {est.name}
                  </p>
                  <p className="text-xs text-text-muted">{est.city}</p>
                </div>
              </div>
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            </div>

            {/* Detail rows */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Valor mensual</span>
                <span className="font-mono font-semibold text-text-primary">
                  {formatCOP(est.valorMensual)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">IVA</span>
                <span className="text-text-muted">No aplica</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Proximo cobro</span>
                <span className="font-medium text-text-primary">
                  {est.proximoCobro}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Meses pagados</span>
                <span className="text-text-primary">{est.mesesPagados}</span>
              </div>
            </div>

            {/* Payment history */}
            <div className="border-t border-border">
              <div className="px-4 py-3">
                <span className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold">
                  HISTORIAL DE COBROS
                </span>
              </div>
              {est.historial && est.historial.length > 0 ? (
                <div className="divide-y divide-border">
                  {est.historial.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-4 py-2.5 text-sm"
                    >
                      <span className="text-text-secondary">{h.fecha}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-text-primary">
                          {formatCOP(h.monto)}
                        </span>
                        <Badge
                          variant={h.status === "pagado" ? "success" : "warning"}
                          size="sm"
                        >
                          {h.status === "pagado" ? "PAGADO" : "PENDIENTE"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-xs text-text-muted">
                  Sin cobros registrados aun
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Calculate months paid since subscription start. */
function calcMesesPagados(fechaInicio: string): number {
  const start = new Date(fechaInicio);
  const now = new Date();
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  return Math.max(0, months);
}
