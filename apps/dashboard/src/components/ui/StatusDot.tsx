import clsx from "clsx";

interface StatusDotProps {
  status: "live" | "offline" | "warning";
  size?: "sm" | "md";
}

const sizeMap: Record<NonNullable<StatusDotProps["size"]>, string> = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
};

const colorMap: Record<StatusDotProps["status"], string> = {
  live: "bg-green",
  offline: "bg-text-muted",
  warning: "bg-warning",
};

export function StatusDot({ status, size = "md" }: StatusDotProps) {
  return (
    <span
      className={clsx(
        "inline-block rounded-full shrink-0",
        sizeMap[size],
        colorMap[status],
        status === "live" && "animate-pulse-live",
      )}
      aria-label={status}
    />
  );
}
