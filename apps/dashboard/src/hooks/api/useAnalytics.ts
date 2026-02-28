import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export interface AnalyticsKpi {
  label: string;
  valor: number;
  unidad: string;
  cambio: number;
  tendencia: "up" | "down" | "neutral";
}

export interface HeatmapPoint {
  dia: string;
  hora: number;
  valor: number;
}

export interface GeneroCount {
  genero: string;
  cantidad: number;
  porcentaje: number;
}

export interface PerfilCliente {
  edadPromedio: number;
  generoPredominante: string;
  ticketPromedio: number;
  frecuenciaVisita: number;
}

export interface AnalyticsData {
  kpis: AnalyticsKpi[];
  heatmap: HeatmapPoint[];
  generos: GeneroCount[];
  perfilCliente: PerfilCliente;
}

interface AnalyticsParams {
  negocioId?: string;
  periodo?: string;
}

export function useAnalytics(params: AnalyticsParams = {}) {
  const { negocioId, periodo = "30d" } = params;

  const searchParams = new URLSearchParams({ periodo });
  if (negocioId) searchParams.set("negocioId", negocioId);

  return useQuery<AnalyticsData>({
    queryKey: ["analytics", periodo, negocioId],
    queryFn: () =>
      apiGet<AnalyticsData>(`/api/analytics?${searchParams.toString()}`),
    staleTime: 5 * 60 * 1000,
  });
}
