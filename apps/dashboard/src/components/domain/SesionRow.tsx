import clsx from "clsx";
import { formatCOP, formatDuration } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

type SesionEstado = "activa" | "finalizada" | "cancelada";

interface SesionRowProps {
  id: string;
  establecimiento: string;
  fecha: string;
  duracion: number;
  canciones: number;
  ingresos: number;
  estado: SesionEstado;
  onClick?: () => void;
}

function parseFecha(iso: string) {
  const d = new Date(iso);
  const months = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  return {
    day: d.getDate(),
    month: months[d.getMonth()],
  };
}

export function SesionRow({
  establecimiento,
  fecha,
  duracion,
  canciones,
  ingresos,
  estado,
  onClick,
}: SesionRowProps) {
  const { day, month } = parseFecha(fecha);
  const isActive = estado === "activa";

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={clsx(
        "flex items-center gap-4 px-4 py-3 rounded-lg transition-colors",
        isActive && "border-l-[3px] border-green",
        !isActive && "border-l-[3px] border-transparent",
        onClick && "cursor-pointer hover:bg-surface-hover",
      )}
    >
      {/* Date column */}
      <div className="flex flex-col items-center justify-center w-14 shrink-0">
        <span className="text-xl font-bold text-text-primary leading-none">
          {day}
        </span>
        <span className="text-[10px] uppercase text-text-muted tracking-wider mt-0.5">
          {month}
        </span>
      </div>

      {/* Vertical separator */}
      <div className="w-px h-8 bg-border shrink-0" />

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary truncate">
            {establecimiento}
          </span>
          {isActive && (
            <Badge variant="live" size="sm" pulsing>
              Activa
            </Badge>
          )}
        </div>
        <span className="text-xs text-text-secondary mt-0.5 block">
          {canciones} canciones &middot; {formatDuration(duracion)}
        </span>
      </div>

      {/* Amount */}
      <span className="font-mono font-bold text-gold text-sm shrink-0 text-right">
        {formatCOP(ingresos)}
      </span>
    </div>
  );
}
