import { Check, Clock } from "lucide-react";
import { formatCOP } from "@/lib/format";
import { Button } from "@/components/ui/Button";

interface EstablishmentSaldo {
  name: string;
  saldo: number;
}

interface SaldoBoxProps {
  saldoReal: number;
  saldoBono: number;
  establecimientos?: EstablishmentSaldo[];
  ventanaAbierta?: boolean;
  proximaVentana?: string;
}

export function SaldoBox({
  saldoReal,
  saldoBono,
  establecimientos,
  ventanaAbierta,
  proximaVentana,
}: SaldoBoxProps) {
  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      {/* Section label */}
      <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
        SALDO CONSOLIDADO
      </span>

      {/* Main value */}
      <p className="text-[32px] font-mono font-bold text-gold mt-2 leading-tight">
        {formatCOP(saldoReal)}
      </p>
      <p className="text-xs text-text-secondary mt-1">Disponible para retirar</p>

      {/* Bono balance */}
      {saldoBono > 0 && (
        <p className="text-xs text-text-muted mt-2">
          Saldo bono:{" "}
          <span className="font-mono text-gold-light">
            {formatCOP(saldoBono)}
          </span>
        </p>
      )}

      {/* Establishment breakdown */}
      {establecimientos && establecimientos.length > 1 && (
        <div className="mt-4 pt-3 border-t border-border space-y-2">
          {establecimientos.map((est) => (
            <div
              key={est.name}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-text-secondary truncate mr-2">
                {est.name}
              </span>
              <span className="font-mono text-text-primary shrink-0">
                {formatCOP(est.saldo)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Ventana indicator */}
      {ventanaAbierta !== undefined && (
        <div className="mt-4 pt-3 border-t border-border">
          {ventanaAbierta ? (
            <div className="flex items-center gap-2 text-sm text-success">
              <Check className="w-4 h-4 shrink-0" />
              <span>Ventana de retiro abierta</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-warning">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                Pr&oacute;xima ventana:{" "}
                <span className="font-medium">{proximaVentana}</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      {ventanaAbierta && (
        <Button variant="secondary" size="md" className="w-full mt-4">
          Solicitar retiro
        </Button>
      )}
    </div>
  );
}
