import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export interface Sesion {
  id: string;
  establishmentId: string;
  establishmentName: string;
  startedAt: string;
  endedAt: string | null;
  totalRecaudado: number;
  totalCanciones: number;
  duracionMinutos: number;
  status: "active" | "ended";
  peakConnectedUsers: number;
}

export interface SesionesResponse {
  items: Sesion[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface SesionesParams {
  page?: number;
  pageSize?: number;
  status?: "active" | "ended" | "all";
  establishmentId?: string;
}

export function useSesiones(params: SesionesParams = {}) {
  const { page = 1, pageSize = 20, status = "all", establishmentId } = params;

  const searchParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    status,
  });
  if (establishmentId) {
    searchParams.set("establishmentId", establishmentId);
  }

  return useQuery<SesionesResponse>({
    queryKey: ["sesiones", page, pageSize, status, establishmentId],
    queryFn: () =>
      apiGet<SesionesResponse>(`/api/sesiones?${searchParams.toString()}`),
    staleTime: 60 * 1000,
  });
}
