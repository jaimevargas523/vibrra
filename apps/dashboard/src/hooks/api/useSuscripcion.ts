import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export interface Suscripcion {
  id: string;
  hostUid: string;
  plan: "gratuito" | "basico" | "profesional" | "empresarial";
  estado: "activa" | "cancelada" | "vencida";
  precioMensual: number;
  fechaInicio: string;
  fechaRenovacion: string;
  establecimientosMax: number;
  sesionesMax: number;
  caracteristicas: string[];
}

export function useSuscripcion() {
  return useQuery<Suscripcion>({
    queryKey: ["suscripcion"],
    queryFn: () => apiGet<Suscripcion>("/api/suscripcion"),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
