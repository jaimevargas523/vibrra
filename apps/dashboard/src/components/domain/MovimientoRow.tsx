import {
  TrendingUp,
  Wifi,
  ArrowDownLeft,
  CreditCard,
  RefreshCcw,
  Heart,
  Gift,
} from "lucide-react";
import clsx from "clsx";
import { formatCOP } from "@/lib/format";
import type { LucideIcon } from "lucide-react";

type MovimientoTipo =
  | "puja"
  | "conexion"
  | "retiro"
  | "suscripcion"
  | "recarga"
  | "dedicatoria"
  | "bono";

interface MovimientoRowProps {
  id: string;
  tipo: MovimientoTipo;
  titulo: string;
  establecimiento: string;
  fecha: string;
  bruto: number;
  comisionVibrra: number;
  comisionWompi: number;
  montoNeto: number;
  estado: string;
  onClick?: () => void;
}

interface TipoConfig {
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
}

const TIPO_CONFIG: Record<MovimientoTipo, TipoConfig> = {
  puja: { icon: TrendingUp, bgColor: "bg-success/15", iconColor: "text-success" },
  conexion: { icon: Wifi, bgColor: "bg-info/15", iconColor: "text-info" },
  retiro: { icon: ArrowDownLeft, bgColor: "bg-gold/15", iconColor: "text-gold" },
  suscripcion: { icon: CreditCard, bgColor: "bg-purple/15", iconColor: "text-purple" },
  recarga: { icon: RefreshCcw, bgColor: "bg-success/15", iconColor: "text-success" },
  dedicatoria: { icon: Heart, bgColor: "bg-warning/15", iconColor: "text-warning" },
  bono: { icon: Gift, bgColor: "bg-gold/15", iconColor: "text-gold" },
};

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  const months = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function MovimientoRow({
  tipo,
  titulo,
  establecimiento,
  fecha,
  bruto,
  comisionVibrra,
  comisionWompi,
  montoNeto,
  onClick,
}: MovimientoRowProps) {
  const config = TIPO_CONFIG[tipo] ?? TIPO_CONFIG.puja;
  const Icon = config.icon;
  const isPositive = montoNeto >= 0;

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
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
        onClick && "cursor-pointer hover:bg-surface-hover",
      )}
    >
      {/* Icon box */}
      <div
        className={clsx(
          "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
          config.bgColor,
        )}
      >
        <Icon className={clsx("w-4 h-4", config.iconColor)} />
      </div>

      {/* Title + details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary truncate">
            {titulo}
          </span>
        </div>
        <span className="text-xs text-text-secondary block truncate">
          {establecimiento} &middot; {formatShortDate(fecha)}
        </span>
      </div>

      {/* Desglose + Net amount */}
      <div className="flex flex-col items-end shrink-0">
        <span
          className={clsx(
            "font-mono font-bold text-sm",
            isPositive ? "text-success" : "text-error",
          )}
        >
          {isPositive ? "+" : ""}
          {formatCOP(montoNeto)}
        </span>
        <span className="text-[10px] text-text-muted mt-0.5 whitespace-nowrap">
          Bruto {formatCOP(bruto)} &middot; VIBRRA {formatCOP(comisionVibrra)} &middot; Wompi{" "}
          {formatCOP(comisionWompi)}
        </span>
      </div>
    </div>
  );
}
