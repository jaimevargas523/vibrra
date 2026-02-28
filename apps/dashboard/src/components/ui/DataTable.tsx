import { type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import clsx from "clsx";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

interface PaginationConfig {
  page: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pagination?: PaginationConfig;
  onRowClick?: (item: T) => void;
  emptyState?: ReactNode;
  loading?: boolean;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  pagination,
  onRowClick,
  emptyState,
  loading = false,
}: DataTableProps<T>) {
  const totalPages = pagination
    ? Math.max(1, pagination.total)
    : 1;

  return (
    <div className="w-full bg-surface rounded-xl border border-border overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead>
            <tr className="bg-card-dark">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    "px-4 py-3 text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold whitespace-nowrap",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    !col.align && "text-left",
                  )}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, rowIdx) => (
                  <tr key={rowIdx} className="border-t border-border">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <Skeleton className="h-4 w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              : data.length === 0
                ? (
                  <tr>
                    <td colSpan={columns.length}>
                      {emptyState ?? (
                        <div className="py-12 text-center text-sm text-text-muted">
                          Sin datos disponibles
                        </div>
                      )}
                    </td>
                  </tr>
                )
                : data.map((item, rowIdx) => (
                  <tr
                    key={item.id ?? rowIdx}
                    className={clsx(
                      "border-t border-border hover:bg-surface-hover transition-colors",
                      onRowClick && "cursor-pointer",
                    )}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={clsx(
                          "px-4 py-3 text-sm",
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center",
                        )}
                      >
                        {col.render
                          ? col.render(item)
                          : String(
                              (item as Record<string, unknown>)[col.key] ?? "",
                            )}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm text-text-secondary">
          <span>
            P&aacute;gina {pagination.page} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="p-1.5 rounded-lg hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="p-1.5 rounded-lg hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
