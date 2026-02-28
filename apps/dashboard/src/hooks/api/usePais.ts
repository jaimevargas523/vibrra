import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export interface MonedaConfig {
  code: string;
  symbol: string;
  locale: string;
}

export interface PaisConfig {
  code: string;
  nombre: string;
  activo: boolean;

  moneda: MonedaConfig;

  fiscal: {
    iva: number;
    comisionPlataforma: number;
  };

  suscripcion: {
    precioMensual: number;
    saldoMinimoPorEstablecimiento: number;
    bonoActivacion: number;
  };

  recarga: {
    montos: { id: string; valor: number; etiqueta: string }[];
    modos: { id: string; emoji: string; label: string }[];
    tablaBonos: Record<string, Record<string, { canciones: number; conexiones: number }>>;
    costoExtraGenerosa: number;
    minimoBloqueado: number;
  };

  recargaAnfitrion: {
    planes: { amount: number; bonusPercent: number; bonus: number; total: number; recommended?: boolean }[];
    pasarela: { nombre: string; proveedores: string[]; metodos: string[] };
  };

  documentosEstablecimiento: { key: string; labelKey: string }[];

  legal: {
    terminos: { url: string; version: string };
    politicaDatos: { url: string; version: string };
  };
}

export function usePais() {
  return useQuery<PaisConfig>({
    queryKey: ["mi-pais"],
    queryFn: () => apiGet<PaisConfig>("/api/mi-pais"),
    staleTime: 30 * 60 * 1000,
  });
}
