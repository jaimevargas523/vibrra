import clsx from "clsx";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "card" | "chart";
}

const variantStyles: Record<NonNullable<SkeletonProps["variant"]>, string> = {
  text: "h-4 w-full rounded",
  card: "h-32 w-full rounded-xl",
  chart: "h-64 w-full rounded-xl",
};

export function Skeleton({ className, variant = "text" }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "bg-border/50 animate-pulse",
        variantStyles[variant],
        className,
      )}
      aria-hidden="true"
    />
  );
}

/** Full-page skeleton shown as Suspense fallback inside DashboardLayout */
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      {/* KPI row skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>

      {/* Chart skeleton */}
      <Skeleton variant="chart" />

      {/* Table skeleton */}
      <Skeleton variant="card" className="h-48" />
    </div>
  );
}
