import { adminDb } from "./firebase-admin";

export interface PaisConfig {
  code: string;
  nombre: string;
  activo: boolean;
  moneda: { code: string; symbol: string; locale: string };
  fiscal: { iva: number; comisionPlataforma: number };
  suscripcion: {
    precioMensual: number;
    saldoMinimoPorEstablecimiento: number;
    bonoActivacion: number;
  };
  recarga: {
    montos: { id: string; valor: number; etiqueta: string }[];
    modos: { id: string; emoji: string; label: string }[];
    tablaBonos: Record<
      string,
      Record<string, { canciones: number; conexiones: number }>
    >;
    costoExtraGenerosa: number;
    minimoBloqueado: number;
  };
  recargaAnfitrion: {
    planes: {
      amount: number;
      bonusPercent: number;
      bonus: number;
      total: number;
      recommended?: boolean;
    }[];
    pasarela: { nombre: string; proveedores: string[]; metodos: string[] };
  };
  documentosEstablecimiento: { key: string; labelKey: string }[];
  legal: {
    terminos: { url: string; version: string };
    politicaDatos: { url: string; version: string };
  };
  bancos: { key: string; nombre: string }[];
  tiposCuenta: { key: string; nombre: string }[];
  tiposPersona: { key: string; nombre: string }[];
  regimenesTributarios: { key: string; nombre: string }[];
}

// In-memory cache (5 min TTL)
const cache = new Map<string, { data: PaisConfig; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function getPaisConfig(
  code: string,
): Promise<PaisConfig | null> {
  const cached = cache.get(code);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  const snap = await adminDb().collection("Paises").doc(code).get();
  if (!snap.exists) return null;

  const data = snap.data() as PaisConfig;
  cache.set(code, { data, expiresAt: Date.now() + CACHE_TTL });
  return data;
}
