import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import clsx from "clsx";

interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  accentColor?: string;
}

export function KpiCard({
  label,
  value,
  sublabel,
  icon,
  trend,
  accentColor = "text-gold",
}: KpiCardProps) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      {/* Top row */}
      <div className="flex items-center gap-3 mb-3">
        {icon && (
          <div
            className={clsx(
              "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
              accentColor === "text-gold" && "bg-gold/10",
              accentColor === "text-success" && "bg-success/10",
              accentColor === "text-error" && "bg-error/10",
              accentColor === "text-info" && "bg-info/10",
              accentColor === "text-green" && "bg-green/10",
              accentColor === "text-warning" && "bg-warning/10",
              accentColor === "text-purple" && "bg-purple/10",
              /* Fallback for any other accent */
              ![
                "text-gold",
                "text-success",
                "text-error",
                "text-info",
                "text-green",
                "text-warning",
                "text-purple",
              ].includes(accentColor) && "bg-gold/10",
            )}
          >
            <span className={clsx(accentColor, "[&>svg]:w-4 [&>svg]:h-4")}>
              {icon}
            </span>
          </div>
        )}
        <span className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold leading-none">
          {label}
        </span>
      </div>

      {/* Value */}
      <p className={clsx("text-[22px] font-mono font-bold", accentColor)}>
        {value}
      </p>

      {/* Sublabel + trend */}
      {sublabel && (
        <div className="flex items-center gap-1.5 mt-1">
          {trend === "up" && (
            <TrendingUp className="w-3.5 h-3.5 text-success shrink-0" />
          )}
          {trend === "down" && (
            <TrendingDown className="w-3.5 h-3.5 text-error shrink-0" />
          )}
          {trend === "neutral" && (
            <Minus className="w-3.5 h-3.5 text-text-muted shrink-0" />
          )}
          <span
            className={clsx(
              "text-xs",
              trend === "up" && "text-success",
              trend === "down" && "text-error",
              (!trend || trend === "neutral") && "text-text-secondary",
            )}
          >
            {sublabel}
          </span>
        </div>
      )}
    </div>
  );
}
