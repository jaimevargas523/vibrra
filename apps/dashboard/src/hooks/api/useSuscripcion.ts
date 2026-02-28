import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export interface Suscripcion {
  id: string | null;
  estado: "activa" | "cancelada" | "vencida";
  precioMensual: number;
  fechaInicio: string | null;
  fechaRenovacion: string | null;
  mesesPagados: number;
}

export function useSuscripcion() {
  return useQuery<Suscripcion>({
    queryKey: ["suscripcion"],
    queryFn: () => apiGet<Suscripcion>("/api/suscripcion"),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
