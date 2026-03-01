import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { TipoMovimiento, CategoriaMovimiento } from "@/types/movimiento";

export interface Movimiento {
  id: string;
  anfitrion_id: string;
  tipo: TipoMovimiento;
  categoria: CategoriaMovimiento;
  monto_real: number;
  monto_bono: number;
  monto_total: number;
  saldo_real_post: number;
  saldo_bono_post: number;
  descripcion: string;
  referencia_id: string | null;
  cliente_id: string | null;
  sesion_id: string | null;
  cancion_id: string | null;
  fee_wompi: number;
  retencion: number;
  ica: number;
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
