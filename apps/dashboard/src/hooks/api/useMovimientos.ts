import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export interface Movimiento {
  id: string;
  type: "ingreso" | "retiro" | "bonificacion" | "comision";
  amount: number;
  description: string;
  sessionId: string | null;
  establishmentName: string | null;
  createdAt: string;
  status: "completed" | "pending" | "failed";
  reference: string | null;
}

export interface MovimientosResponse {
  items: Movimiento[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface MovimientosParams {
  page?: number;
  pageSize?: number;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useMovimientos(params: MovimientosParams = {}) {
  const { page = 1, pageSize = 20, type, dateFrom, dateTo } = params;

  const searchParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  if (type) searchParams.set("type", type);
  if (dateFrom) searchParams.set("dateFrom", dateFrom);
  if (dateTo) searchParams.set("dateTo", dateTo);

  return useQuery<MovimientosResponse>({
    queryKey: ["movimientos", page, pageSize, type, dateFrom, dateTo],
    queryFn: () =>
      apiGet<MovimientosResponse>(`/api/movimientos?${searchParams.toString()}`),
    staleTime: 60 * 1000,
  });
}
