interface Props {
  saldoTotal: number;
  saldoDisponible: number;
  minimoBloqueado: number;
  fmt: (n: number) => string;
}

export function BarraSaldo({ saldoTotal, saldoDisponible, minimoBloqueado, fmt }: Props) {
  const porcentaje = saldoTotal > 0 ? Math.min(100, (saldoDisponible / saldoTotal) * 100) : 0;

  return (
    <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
      {/* Totals row */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
            SALDO TOTAL
          </span>
          <p className="font-mono text-xl font-bold text-gold mt-0.5">
            {fmt(saldoTotal)}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
            DISPONIBLE
          </span>
          <p className="font-mono text-xl font-bold text-success mt-0.5">
            {fmt(saldoDisponible)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-success rounded-full transition-all duration-300"
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <p className="text-[10px] text-text-muted text-center">
        Min. bloqueado: {fmt(minimoBloqueado)}
      </p>
    </div>
  );
}
