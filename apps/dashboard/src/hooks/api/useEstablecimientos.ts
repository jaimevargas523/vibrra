import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export interface EstablecimientoListItem {
  id: string;
  name: string;
  address: string;
  city: string;
  type: string;
  isActive: boolean;
  imageUrl: string | null;
  totalSesiones: number;
  totalRecaudado: number;
}

export function useEstablecimientos() {
  return useQuery<EstablecimientoListItem[]>({
    queryKey: ["establecimientos"],
    queryFn: () => apiGet<EstablecimientoListItem[]>("/api/negocios"),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
