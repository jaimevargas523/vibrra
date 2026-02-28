import clsx from "clsx";
import type { ReactNode } from "react";

type BadgeVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "gold"
  | "neutral"
  | "live"
  | "purple";

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  size?: "sm" | "md";
  pulsing?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  error: "bg-error/15 text-error",
  info: "bg-info/15 text-info",
  gold: "bg-gold/15 text-gold",
  neutral: "bg-border text-text-secondary",
  live: "bg-green/15 text-green",
  purple: "bg-purple/15 text-purple",
};

const sizeStyles: Record<NonNullable<BadgeProps["size"]>, string> = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-0.5 text-[11px]",
};

export function Badge({
  variant,
  children,
  size = "md",
  pulsing = false,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wider leading-none",
        variantStyles[variant],
        sizeStyles[size],
      )}
    >
      {variant === "live" && pulsing && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
        </span>
      )}
      {children}
    </span>
  );
}
