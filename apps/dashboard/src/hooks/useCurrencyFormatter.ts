import { useMemo } from "react";
import { usePais } from "@/hooks/api/usePais";
import { formatCurrency } from "@/lib/format";

/**
 * Returns a currency formatter function configured for the host's country.
 * Falls back to COP formatting while loading.
 *
 * Usage:
 *   const fmt = useCurrencyFormatter();
 *   fmt(125000) // "$125.000"
 */
export function useCurrencyFormatter(): (n: number) => string {
  const { data: pais } = usePais();

  return useMemo(() => {
    const moneda = pais?.moneda;
    return (n: number) => formatCurrency(n, moneda);
  }, [pais?.moneda]);
}
