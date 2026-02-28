import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Monto, Modo, Bonos } from "@/hooks/useRecargaCliente";

interface Props {
  montos: Monto[];
  modos: Modo[];
  tablaBonos: Record<string, Record<string, Bonos>>;
  fmt: (n: number) => string;
}

export function TablaBonificacion({ montos, modos, tablaBonos, fmt }: Props) {
  const [abierta, setAbierta] = useState(false);

  if (montos.length === 0) return null;

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setAbierta(!abierta)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-surface-hover transition-colors"
      >
        <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
          TABLA DE BONIFICACION
        </span>
        {abierta ? (
          <ChevronUp className="w-4 h-4 text-text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-muted" />
        )}
      </button>

      {/* Table */}
      {abierta && (
        <div className="px-4 pb-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 text-text-muted font-semibold">Monto</th>
                {modos.map((modo) => (
                  <th key={modo.id} className="text-center py-2 px-2 text-text-muted font-semibold">
                    {modo.emoji} {modo.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {montos.map((monto) => (
                <tr key={monto.id} className="border-b border-border/50">
                  <td className="py-2.5 pr-3 font-mono font-semibold text-text-primary">
                    {fmt(monto.valor)}
                  </td>
                  {modos.map((modo) => {
                    const bonos = tablaBonos[monto.id]?.[modo.id];
                    return (
                      <td key={modo.id} className="text-center py-2.5 px-2">
                        <span className="text-blue-400 font-mono">{"\uD83C\uDFB5"}x{bonos?.canciones ?? 0}</span>
                        {" "}
                        <span className="text-success font-mono">{"\uD83D\uDD0C"}x{bonos?.conexiones ?? 0}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
