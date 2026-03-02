/**
 * Tipos de movimiento para el API (Next.js routes).
 * Modelo de crédito VIBRRA — el anfitrión opera con crédito ilimitado.
 */

// ── Tipos ────────────────────────────────────────────────────

export type TipoMovimiento =
  | "RECARGA_CLIENTE"
  | "RECARGA_CLIENTE_BONO"
  | "COMISION_RECARGA"
  | "PARTICIPACION_SESION"
  | "LIQUIDACION_COBRO"
  | "LIQUIDACION_SUSCRIPCION"
  | "LIQUIDACION_DEUDA"
  | "LIQUIDACION_MORA"
  | "BONO_ARRANQUE"
  | "AJUSTE_ADMIN";

export type CategoriaMovimiento =
  | "RECAUDO"
  | "RECAUDO_BONO"
  | "INGRESO"
  | "LIQUIDACION"
  | "BONO"
  | "AJUSTE"
  | "INFORMATIVO";

export const TIPO_A_CATEGORIA: Record<TipoMovimiento, CategoriaMovimiento> = {
  RECARGA_CLIENTE:          "RECAUDO",
  RECARGA_CLIENTE_BONO:     "RECAUDO_BONO",
  COMISION_RECARGA:         "INGRESO",
  PARTICIPACION_SESION:     "INGRESO",
  LIQUIDACION_COBRO:        "LIQUIDACION",
  LIQUIDACION_SUSCRIPCION:  "LIQUIDACION",
  LIQUIDACION_DEUDA:        "LIQUIDACION",
  LIQUIDACION_MORA:         "INFORMATIVO",
  BONO_ARRANQUE:            "BONO",
  AJUSTE_ADMIN:             "AJUSTE",
};

// ── Interface del documento Movimiento ───────────────────────

export interface MovimientoDoc {
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
  creado_por: "cloud_function" | "sistema" | "admin";
}

// ── Factory helper ───────────────────────────────────────────

/**
 * Crea un documento de movimiento con campos por defecto.
 */
export function crearMovimiento(
  anfitrion_id: string,
  tipo: TipoMovimiento,
  opts: {
    monto: number;
    comision?: number;
    participacion?: number;
    recaudo_post: number;
    comisiones_post: number;
    participacion_post: number;
    descripcion: string;
    cliente_id?: string;
    sesion_id?: string;
    creado_por?: "cloud_function" | "sistema" | "admin";
  },
): MovimientoDoc {
  return {
    anfitrion_id,
    tipo,
    categoria: TIPO_A_CATEGORIA[tipo],
    monto: opts.monto,
    comision: opts.comision ?? 0,
    participacion: opts.participacion ?? 0,
    recaudo_post: opts.recaudo_post,
    comisiones_post: opts.comisiones_post,
    participacion_post: opts.participacion_post,
    descripcion: opts.descripcion,
    cliente_id: opts.cliente_id ?? null,
    sesion_id: opts.sesion_id ?? null,
    timestamp: new Date().toISOString(),
    creado_por: opts.creado_por ?? "cloud_function",
  };
}
