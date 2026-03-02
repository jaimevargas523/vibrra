import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

/**
 * Estado financiero del mes en curso del anfitrión.
 * Modelo de crédito: no hay saldoReal/saldoBono.
 */
export interface MovimientosResumen {
  recaudoMes: number;
  comisionesMes: number;
  participacionMes: number;
  gananciaDigital: number;
  gananciaNeta: number;
  suscripcionMonto: number;
  deudaBruta: number;
  efectivoAEntregar: number;
  efectivoAQuedarse: number;
  bonoArranqueSaldo: number;
  bonoArranqueUsado: number;
  liquidacionEstado: "pendiente" | "pagado" | "mora";
  liquidacionDeuda: number;
  liquidacionFecha: string | null;
}

export function useMovimientosResumen() {
  return useQuery<MovimientosResumen>({
    queryKey: ["movimientos-resumen"],
    queryFn: () => apiGet<MovimientosResumen>("/api/movimientos/resumen"),
    staleTime: 2 * 60 * 1000,
  });
}
