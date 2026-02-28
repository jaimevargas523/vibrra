import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export interface MovimientosResumen {
  saldoDisponible: number;
  totalIngresos: number;
  totalRetiros: number;
  totalBonificaciones: number;
  totalComisiones: number;
  pendientePago: number;
  ultimoRetiro: {
    amount: number;
    date: string;
  } | null;
}

export function useMovimientosResumen() {
  return useQuery<MovimientosResumen>({
    queryKey: ["movimientos-resumen"],
    queryFn: () => apiGet<MovimientosResumen>("/api/movimientos/resumen"),
    staleTime: 2 * 60 * 1000,
  });
}
