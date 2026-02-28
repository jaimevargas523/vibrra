import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export interface ChartDataPoint {
  date: string;
  recaudado: number;
  sesiones: number;
  canciones: number;
}

export interface ResumenChart {
  data: ChartDataPoint[];
  period: "7d" | "30d" | "90d";
}

export function useResumenChart(period: "7d" | "30d" | "90d" = "30d") {
  return useQuery<ResumenChart>({
    queryKey: ["resumen-chart", period],
    queryFn: () => apiGet<ResumenChart>(`/api/movimientos/chart?period=${period}`),
    staleTime: 5 * 60 * 1000,
  });
}
