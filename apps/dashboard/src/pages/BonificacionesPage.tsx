import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Gift } from "lucide-react";
import clsx from "clsx";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

import { useBonificaciones } from "@/hooks/api/useBonificaciones";
import { formatShortDate } from "@/lib/format";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

/* ── Recharge bonus table data ───────────────────────────────── */

const bonoTable = [
  { recarga: 30000, bono: 1500, recibes: 31500, popular: false },
  { recarga: 50000, bono: 4000, recibes: 54000, popular: false },
  { recarga: 100000, bono: 12000, recibes: 112000, popular: true },
  { recarga: 200000, bono: 30000, recibes: 230000, popular: false },
];

export default function BonificacionesPage() {
  const { t } = useTranslation("bonificaciones");
  const { data, isLoading } = useBonificaciones();
  const fmt = useCurrencyFormatter();

  const totalDisponible = data?.totalDisponible ?? 0;
  const totalReclamado = data?.totalReclamado ?? 0;
  const totalBono = totalDisponible + totalReclamado;
  const usedPercent = totalBono > 0 ? (totalReclamado / totalBono) * 100 : 0;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* ── Info banner ───────────────────────────────── */}
      <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 flex items-start gap-3">
        <span className="text-xl shrink-0 mt-0.5">{"\uD83D\uDCA1"}</span>
        <div>
          <p className="text-sm font-bold text-gold">
            Los bonos no son dinero real
          </p>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            Los bonos son saldo promocional que puedes usar para cubrir pujas en sesiones.
            No son retirables ni transferibles. Se consumen automaticamente antes del saldo real.
          </p>
        </div>
      </div>

      {/* ── Welcome bonus card ────────────────────────── */}
      <div className="bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
              BONO DE BIENVENIDA
            </span>
            <p className="text-[30px] font-bold text-gold-light mt-1 leading-tight">
              $30.000
            </p>
          </div>
          <Badge variant="gold">ACTIVO</Badge>
        </div>

        <div className="border-t border-gold/15 mt-4 pt-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-text-muted">Disponible</p>
              <p className="font-mono font-semibold text-gold">
                {fmt(totalDisponible)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Usado</p>
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
            No retirable &middot; solo consumible
          </p>
          <p className="text-[10px] text-text-muted">
            Vence: 30 dias despues del registro
          </p>
        </div>

        {/* Tip */}
        <div className="bg-gold/5 border border-gold/10 rounded-lg p-3 mt-4">
          <p className="text-xs text-text-secondary leading-relaxed">
            {"\uD83D\uDCA1"} Usalo para cubrir tus propias pujas durante pruebas iniciales
            o para incentivar a los primeros usuarios de tu establecimiento.
          </p>
        </div>
      </div>

      {/* ── Recharge bonus table ──────────────────────── */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
            BONOS POR RECARGA &middot; MODELO A
          </span>
          <Link
            to="/anfitrion/recargar"
            className="text-xs text-gold hover:text-gold-light transition-colors font-medium"
          >
            Recargar &rarr;
          </Link>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-card-dark">
              <th className="px-4 py-3 text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold text-left">
                RECARGA
              </th>
              <th className="px-4 py-3 text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold text-left">
                BONO
              </th>
              <th className="px-4 py-3 text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold text-left">
                RECIBES
              </th>
            </tr>
          </thead>
          <tbody>
            {bonoTable.map((row) => (
              <tr
                key={row.recarga}
                className={clsx(
                  "border-t border-border hover:bg-surface-hover transition-colors",
                  row.popular && "bg-gold/5 border-gold/20"
                )}
              >
                <td className="px-4 py-3 font-mono font-medium text-text-primary">
                  {fmt(row.recarga)}
                </td>
                <td className="px-4 py-3 font-mono text-success">
                  +{fmt(row.bono)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-gold">
                      {fmt(row.recibes)}
                    </span>
                    {row.popular && (
                      <span className="text-gold">{"\u2605"}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-4 py-3 text-[10px] text-text-muted border-t border-border">
          {"\u2605"} Mas popular. Los bonos no son retirables.
        </p>
      </div>

      {/* ── Bonus history ─────────────────────────────── */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
            HISTORIAL DE BONOS
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
            Sin bonos registrados aun
          </div>
        )}
      </div>

      {/* ── CTA ───────────────────────────────────────── */}
      <Link to="/anfitrion/recargar" className="block">
        <Button className="w-full" size="lg">
          <Gift className="w-5 h-5" />
          Recargar y ganar bono
        </Button>
      </Link>
    </div>
  );
}
