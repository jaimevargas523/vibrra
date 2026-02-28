import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api-client";
import { useCallback } from "react";

export interface Mensaje {
  id: string;
  tipo: "global" | "personal";
  titulo: string;
  descripcion: string;
  estilo: "gold" | "info" | "success" | "warning";
  icono: "gift" | "info" | "alert" | "megaphone";
  cta: { texto: string; ruta: string } | null;
  createdAt: string;
}

export function useMensajes() {
  return useQuery<Mensaje[]>({
    queryKey: ["mensajes"],
    queryFn: () => apiGet<Mensaje[]>("/api/mensajes"),
    staleTime: 2 * 60 * 1000,
  });
}

export function useMensajeActions() {
  const queryClient = useQueryClient();

  const marcarLeido = useCallback(
    async (id: string) => {
      await apiPost(`/api/mensajes/${id}/leer`);
      queryClient.invalidateQueries({ queryKey: ["mensajes"] });
    },
    [queryClient],
  );

  const eliminar = useCallback(
    async (id: string) => {
      await apiDelete(`/api/mensajes/${id}`);
      queryClient.invalidateQueries({ queryKey: ["mensajes"] });
    },
    [queryClient],
  );

  return { marcarLeido, eliminar };
}
