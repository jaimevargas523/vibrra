import type { Monto, Modo, Bonos } from "@/hooks/useRecargaCliente";

interface Props {
  monto: Monto | null;
  modo: Modo | null;
  bonos: Bonos | null;
  costoTotal: number;
  fmt: (n: number) => string;
}

export function ResumenRecarga({ monto, modo, bonos, costoTotal, fmt }: Props) {
  if (!monto || !modo) {
    return (
      <div className="bg-surface rounded-xl border border-border p-4 text-center">
        <p className="text-sm text-text-muted">
          Selecciona un monto y un modo para ver el resumen.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-gold/20 p-4 space-y-3">
      <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
        RESUMEN DE RECARGA
      </span>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Monto al cliente</span>
          <span className="font-mono font-semibold text-text-primary">
            {fmt(monto.valor)}
          </span>
        </div>

        {bonos && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">{"\uD83C\uDFB5"} Canciones gratis</span>
              <span className="font-mono font-semibold text-blue-400">
                x{bonos.canciones}
              </span>
            </div>
            {bonos.conexiones > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">{"\uD83D\uDD0C"} Conexiones gratis</span>
                <span className="font-mono font-semibold text-success">
                  x{bonos.conexiones}
                </span>
              </div>
            )}
          </>
        )}

        <div className="border-t border-border pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-text-primary">Total que sale de tu saldo</span>
            <span className="font-mono text-lg font-bold text-gold">
              {fmt(costoTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
