import clsx from "clsx";
import type { Modo, Bonos } from "@/hooks/useRecargaCliente";

const BORDER_COLORS: Record<string, string> = {
  pesimista: "border-blue-400",
  moderada: "border-gold",
  generosa: "border-success",
};

const BG_COLORS: Record<string, string> = {
  pesimista: "bg-blue-400/5",
  moderada: "bg-gold/5",
  generosa: "bg-success/5",
};

interface Props {
  modo: Modo;
  seleccionado: boolean;
  bonos: Bonos | null;
  costoExtraGenerosa: number;
  onClick: () => void;
  fmt: (n: number) => string;
}

export function TarjetaModo({ modo, seleccionado, bonos, costoExtraGenerosa, onClick, fmt }: Props) {
  const borderColor = seleccionado ? BORDER_COLORS[modo.id] ?? "border-border" : "border-border";
  const bgColor = seleccionado ? BG_COLORS[modo.id] ?? "" : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex-1 flex flex-col items-center p-3 rounded-xl border transition-all cursor-pointer relative",
        borderColor,
        bgColor,
        !seleccionado && "bg-surface hover:bg-surface-hover",
      )}
    >
      {/* Badges */}
      {modo.id === "moderada" && (
        <span className="absolute -top-2 right-2 text-[8px] font-bold uppercase tracking-wider bg-gold/15 text-gold border border-gold/25 px-1.5 py-0.5 rounded">
          Sugerida
        </span>
      )}

      {/* Emoji + label */}
      <span className="text-2xl mb-1">{modo.emoji}</span>
      <span className="text-[10px] font-semibold text-text-primary">{modo.label}</span>

      {/* Bonus chips */}
      {bonos && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-blue-400 font-mono font-semibold">
            {"\uD83C\uDFB5"} x{bonos.canciones}
          </span>
          {bonos.conexiones > 0 && (
            <span className="text-[10px] text-success font-mono font-semibold">
              {"\uD83D\uDD0C"} x{bonos.conexiones}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
