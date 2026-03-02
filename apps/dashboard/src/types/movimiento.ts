/**
 * Tipos y constantes del sistema de movimientos VIBRRA.
 * Modelo de crédito: el anfitrión opera con crédito ilimitado,
 * cobra efectivo al cliente, y paga a VIBRRA a fin de mes.
 */

// ── Categorías de movimiento ─────────────────────────────────

export const CATEGORIAS = [
  "RECAUDO",
  "RECAUDO_BONO",
  "INGRESO",
  "LIQUIDACION",
  "BONO",
  "AJUSTE",
  "INFORMATIVO",
] as const;

export type CategoriaMovimiento = (typeof CATEGORIAS)[number];

// ── Catálogo de tipos (~11) ──────────────────────────────────

export const TIPOS_MOVIMIENTO = {
  // Recargas a clientes
  RECARGA_CLIENTE:          { categoria: "RECAUDO"      as const, icon: "🔁", label: "Recarga a cliente",       color: "blue" },
  RECARGA_CLIENTE_BONO:     { categoria: "RECAUDO_BONO" as const, icon: "🔁", label: "Recarga a cliente",       color: "blue" },

  // Ingresos del anfitrión
  COMISION_RECARGA:         { categoria: "INGRESO"      as const, icon: "💵", label: "Comisión de recarga",     color: "green" },
  PARTICIPACION_SESION:     { categoria: "INGRESO"      as const, icon: "🎶", label: "Participación en sesión", color: "green" },

  // Bonos
  BONO_ARRANQUE:            { categoria: "BONO"         as const, icon: "🎁", label: "Bono de arranque",        color: "blue" },

  // Liquidación mensual
  LIQUIDACION_COBRO:        { categoria: "LIQUIDACION"  as const, icon: "📋", label: "Liquidación mensual",     color: "gold" },
  LIQUIDACION_SUSCRIPCION:  { categoria: "LIQUIDACION"  as const, icon: "📅", label: "Suscripción mensual",     color: "gold" },
  LIQUIDACION_DEUDA:        { categoria: "LIQUIDACION"  as const, icon: "⚠️", label: "Deuda generada",          color: "muted" },
  LIQUIDACION_MORA:         { categoria: "INFORMATIVO"  as const, icon: "🚨", label: "Mora",                    color: "red" },

  // Ajustes
  AJUSTE_ADMIN:             { categoria: "AJUSTE"       as const, icon: "↩️", label: "Ajuste administrativo",   color: "muted" },
} as const;

export type TipoMovimiento = keyof typeof TIPOS_MOVIMIENTO;

export interface TipoMeta {
  categoria: CategoriaMovimiento;
  icon: string;
  label: string;
  color: string;
}

// ── Interface del documento Firestore ────────────────────────

export interface MovimientoDoc {
  id?: string;
  anfitrion_id: string;
  cliente_id: string | null;
  sesion_id: string | null;
  tipo: TipoMovimiento;
  categoria: CategoriaMovimiento;

  /** Monto de la operación en COP */
  monto: number;
  /** Comisión generada (10% si es recarga, 0 si no aplica) */
  comision: number;
  /** Participación generada (70% si es gasto de sesión, 0 si no aplica) */
  participacion: number;

  /** Snapshot de recaudo_mes del anfitrión después de esta operación */
  recaudo_post: number;
  /** Snapshot de comisiones_mes del anfitrión después de esta operación */
  comisiones_post: number;
  /** Snapshot de participacion_mes del anfitrión después de esta operación */
  participacion_post: number;

  descripcion: string;
  timestamp: string;
  creado_por: "cloud_function" | "sistema" | "admin";
}

// ── Helpers ──────────────────────────────────────────────────

/** Categorías de filtro para la UI de movimientos */
export const FILTROS_MOVIMIENTO = [
  { id: "todos",       label: "Todos",       categorias: null },
  { id: "recargas",    label: "Recargas",    categorias: ["RECAUDO", "RECAUDO_BONO"] as CategoriaMovimiento[] },
  { id: "ingresos",    label: "Ingresos",    categorias: ["INGRESO"] as CategoriaMovimiento[] },
  { id: "liquidacion", label: "Liquidación", categorias: ["LIQUIDACION"] as CategoriaMovimiento[] },
  { id: "bonos",       label: "Bonos",       categorias: ["BONO"] as CategoriaMovimiento[] },
];

/** Determina si un movimiento es un ingreso para el anfitrión */
export function esIngreso(cat: CategoriaMovimiento): boolean {
  return cat === "INGRESO" || cat === "BONO";
}

/** Determina si un movimiento es un recaudo (operación de recarga) */
export function esRecaudo(cat: CategoriaMovimiento): boolean {
  return cat === "RECAUDO" || cat === "RECAUDO_BONO";
}
