import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export interface SesionReciente {
  id: string;
  establishmentName: string;
  startedAt: string;
  endedAt: string | null;
  totalRecaudado: number;
  totalCanciones: number;
  duracionMinutos: number;
  status: "active" | "ended";
}

export function useResumenSesiones() {
  return useQuery<SesionReciente[]>({
    queryKey: ["resumen-sesiones"],
    queryFn: () => apiGet<SesionReciente[]>("/api/resumen/sesiones-recientes"),
    staleTime: 2 * 60 * 1000,
  });
}
