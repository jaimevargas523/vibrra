import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { TipoMovimiento, CategoriaMovimiento } from "@/types/movimiento";

/**
 * Movimiento individual del modelo de crédito.
 * Monto único (no real/bono separados).
 */
export interface Movimiento {
  id: string;
  anfitrion_id: string;
  cliente_id: string | null;
  sesion_id: string | null;
  tipo: TipoMovimiento;
  categoria: CategoriaMovimiento;
  monto: number;
  comision: number;
  participacion: number;
  recaudo_post: number;
  comisiones_post: number;
  participacion_post: number;
  descripcion: string;
  timestamp: string;
  creado_por: string;
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
  tipo?: string;
  categoria?: string;
}

export function useMovimientos(params: MovimientosParams = {}) {
  const { page = 1, pageSize = 20, tipo, categoria } = params;

  const searchParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  if (tipo) searchParams.set("tipo", tipo);
  if (categoria) searchParams.set("categoria", categoria);

  return useQuery<MovimientosResponse>({
    queryKey: ["movimientos", page, pageSize, tipo, categoria],
    queryFn: () =>
      apiGet<MovimientosResponse>(`/api/movimientos?${searchParams.toString()}`),
    staleTime: 60 * 1000,
  });
}
