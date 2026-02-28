import clsx from "clsx";
import type { Monto } from "@/hooks/useRecargaCliente";

interface Props {
  monto: Monto;
  seleccionado: boolean;
  deshabilitado: boolean;
  onClick: () => void;
  fmt: (n: number) => string;
}

export function TarjetaMonto({ monto, seleccionado, deshabilitado, onClick, fmt }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deshabilitado}
      className={clsx(
        "w-full flex flex-col items-center justify-center p-4 rounded-xl border transition-all",
        deshabilitado && "opacity-35 pointer-events-none",
        seleccionado
          ? "border-gold/40 bg-gold/5"
          : "border-border bg-surface hover:bg-surface-hover cursor-pointer",
      )}
    >
      <span className="font-mono text-lg font-bold text-text-primary">
        {fmt(monto.valor)}
      </span>
      <span className="text-[9px] uppercase tracking-[1.5px] text-text-muted mt-1">
        {monto.etiqueta}
      </span>
    </button>
  );
}
