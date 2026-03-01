import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";

export interface Bonificacion {
  id: string;
  type: "referido" | "promocion" | "logro" | "bienvenida";
  amount: number;
  description: string;
  status: "active" | "claimed" | "expired";
  expiresAt: string | null;
  claimedAt: string | null;
  createdAt: string;
}

export interface BonificacionesResponse {
  items: Bonificacion[];
  totalDisponible: number;
  totalReclamado: number;
}

export function useBonificaciones() {
  return useQuery<BonificacionesResponse>({
    queryKey: ["bonificaciones"],
    queryFn: () => apiGet<BonificacionesResponse>("/api/bonos"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useReclamarBono() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiPost<{ ok: boolean; saldoBono: number }>("/api/perfil/reclamar-bono"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["host-profile"] });
      qc.invalidateQueries({ queryKey: ["bonificaciones"] });
    },
  });
}
