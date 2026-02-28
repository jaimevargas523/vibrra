import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export interface ResumenKpis {
  totalRecaudado: number;
  totalSesiones: number;
  totalCanciones: number;
  promedioSesion: number;
  comparacionMesAnterior: {
    recaudado: number;
    sesiones: number;
    canciones: number;
  };
}

export function useResumenKpis() {
  return useQuery<ResumenKpis>({
    queryKey: ["resumen-kpis"],
    queryFn: () => apiGet<ResumenKpis>("/api/resumen/kpis"),
    staleTime: 2 * 60 * 1000,
  });
}
