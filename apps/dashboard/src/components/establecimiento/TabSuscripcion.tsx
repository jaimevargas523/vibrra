import { Badge } from "@/components/ui/Badge";

import { useSuscripcion } from "@/hooks/api/useSuscripcion";
import { usePais } from "@/hooks/api/usePais";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { formatShortDate } from "@/lib/format";
import type { EstablecimientoDetail } from "@/hooks/api/useEstablecimiento";

/* ── Tab ─────────────────────────────────────────────────────── */

interface Props {
  establecimiento: EstablecimientoDetail;
}

export function TabSuscripcion({ establecimiento: est }: Props) {
  const { data: suscripcion } = useSuscripcion();
  const { data: pais } = usePais();
  const fmt = useCurrencyFormatter();

  const precioMensual = pais?.suscripcion?.precioMensual ?? 0;
  const saldoMinimo = pais?.suscripcion?.saldoMinimoPorEstablecimiento ?? 0;
  const comision = pais?.fiscal?.comisionPlataforma ?? 0;
  const iva = pais?.fiscal?.iva ?? 0;

  const status = suscripcion?.estado ?? "activa";
  const statusLabel =
    status === "activa" ? "ACTIVA" : status === "vencida" ? "VENCIDA" : "CANCELADA";
  const statusVariant =
    status === "activa" ? "success" : status === "vencida" ? "warning" : ("error" as const);

  const proximoCobro = suscripcion?.fechaRenovacion
    ? formatShortDate(new Date(suscripcion.fechaRenovacion))
    : "---";
  const mesesPagados = suscripcion?.mesesPagados ?? 0;

  const emoji = est.type === "bar" ? "\uD83C\uDF7A" : "\uD83C\uDFB5";

  return (
    <div className="space-y-6">
      {/* ── Establishment subscription card ────────────── */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-elevated text-xl">
              {emoji}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{est.name}</p>
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
              {fmt(precioMensual)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Saldo minimo requerido</span>
            <span className="font-mono text-text-primary">{fmt(saldoMinimo)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Comision plataforma</span>
            <span className="text-text-primary">{(comision * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">IVA</span>
            <span className="text-text-primary">{(iva * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Proximo cobro</span>
            <span className="font-medium text-text-primary">{proximoCobro}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Meses pagados</span>
            <span className="text-text-primary">{mesesPagados}</span>
          </div>
        </div>

        {/* Payment history */}
        <div className="border-t border-border">
          <div className="px-4 py-3">
            <span className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold">
              HISTORIAL DE COBROS
            </span>
          </div>
          <div className="px-4 py-6 text-center text-xs text-text-muted">
            Sin cobros registrados aun
          </div>
        </div>
      </div>
    </div>
  );
}
